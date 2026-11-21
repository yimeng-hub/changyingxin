'use strict';
/**
 * 数据层 —— 云端数据库可插拔抽象
 * ------------------------------------------------------------------
 * 通过环境变量选择存储后端：
 *   DB_DRIVER=json     （默认）本地 JSON 文件 data/db.json，零依赖、易运行
 *   DB_DRIVER=postgres 腾讯云 TencentDB for PostgreSQL / 任意 PostgreSQL
 *                     （用 jsonb 整存整取，数据结构 100% 兼容，上层路由零改动）
 *
 * 运行模型：
 *   - 启动时 db.init() 把数据加载进内存（云端或本地）
 *   - read() 同步返回内存，请求路径不阻塞
 *   - save() 同步写本地兜底 + 异步写云端；flush() 等待云端写入完成（seed/关闭前用）
 *
 * 接口约定（供路由层调用）：
 *   db.read()   -> 返回整个数据对象（内存）
 *   db.save()   -> 持久化（本地 + 异步云端）
 *   db.init()   -> 启动预热（异步，返回 Promise）
 *   db.flush()  -> 等待云端写入完成（异步）
 *   db.uid(prefix) / db.nextSort(list)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DRIVER = (process.env.DB_DRIVER || 'json').toLowerCase();

let pgPool = null;
if (DRIVER === 'postgres') {
  try {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: process.env.PG_CONNECTION_STRING,
      ssl: process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 8000,
    });
    console.log('[db] 已启用 PostgreSQL 云端数据库驱动');
  } catch (e) {
    console.error('[db] 加载 pg 失败，请先执行 npm install pg:', e.message);
    process.exit(1);
  }
}

let cache = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadFromDisk() {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    console.error('[db] 读取本地数据库失败，使用空数据:', e.message);
    return null;
  }
}

function writeToDisk(obj) {
  ensureDir();
  // 原子写入：先写临时文件再 rename，避免写入中断损坏数据
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

async function ensurePgTable() {
  await pgPool.query(
    `CREATE TABLE IF NOT EXISTS site_data (id text PRIMARY KEY, payload jsonb, updated_at timestamptz DEFAULT now())`
  );
}

async function loadFromPg() {
  await ensurePgTable();
  const r = await pgPool.query(`SELECT payload FROM site_data WHERE id = 'main'`);
  return r.rows.length ? r.rows[0].payload : null;
}

async function writeToPg(obj) {
  await ensurePgTable();
  await pgPool.query(
    `INSERT INTO site_data (id, payload, updated_at) VALUES ('main', $1::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()`,
    [obj]
  );
}

// 同步读取（路由层保持原调用方式，不阻塞）
function read() {
  if (!cache) cache = loadFromDisk() || {};
  return cache;
}

// 同步写本地兜底 + 异步写云端（不阻塞请求）
function save() {
  if (!cache) return;
  try {
    writeToDisk(cache);
  } catch (e) {
    console.error('[db] 写本地数据库失败:', e.message);
  }
  if (pgPool) {
    writeToPg(cache).catch((e) => console.error('[db] 写云端数据库失败:', e.message));
  }
}

// 等待云端写入完成（用于 seed 初始化、进程关闭前）
async function flush() {
  if (!cache) return;
  writeToDisk(cache);
  if (pgPool) {
    try {
      await writeToPg(cache);
    } catch (e) {
      console.error('[db] 写云端数据库失败:', e.message);
    }
  }
}

// 启动预热：从云端或本地加载到内存
async function init() {
  if (DRIVER === 'postgres') {
    try {
      const pgData = await loadFromPg();
      if (pgData && Object.keys(pgData).length) {
        cache = pgData;
        writeToDisk(cache); // 同步一份到本地兜底
        console.log('[db] 已从云端数据库(PostgreSQL)加载数据');
      } else {
        cache = loadFromDisk() || {};
        if (Object.keys(cache).length) {
          await writeToPg(cache);
          console.log('[db] 云端数据库为空，已用本地数据初始化云端');
        }
      }
    } catch (e) {
      console.error('[db] 云端数据库加载失败，降级为本地 JSON:', e.message);
      cache = loadFromDisk() || {};
    }
  } else {
    cache = loadFromDisk() || {};
  }
  return cache;
}

function uid(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function nextSort(list) {
  if (!Array.isArray(list) || list.length === 0) return 1;
  const max = list.reduce((m, it) => Math.max(m, Number(it.sort) || 0), 0);
  return max + 1;
}

module.exports = { read, save, init, flush, uid, nextSort, DRIVER, DB_FILE, DATA_DIR };
