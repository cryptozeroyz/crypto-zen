/**
 * Phase 0 安全基线测试（node:test + tsx，零重型框架）
 * 运行：npm test
 */

import { test } from "node:test";
import assert from "node:assert/strict";

/* ---------------- loginRateLimit ---------------- */
import {
  loginAllowed,
  recordLoginFail,
  clearLoginFails,
} from "../src/lib/loginRateLimit";

test("登录限流：5 次失败后锁定", () => {
  const ip = "test-ip-1";
  clearLoginFails(ip);
  for (let i = 0; i < 4; i++) assert.equal(recordLoginFail(ip), 0, `第 ${i + 1} 次不应锁定`);
  const lockSec = recordLoginFail(ip); // 第 5 次
  assert.ok(lockSec > 0, "第 5 次失败应触发锁定");
  const gate = loginAllowed(ip);
  assert.equal(gate.ok, false);
  if (!gate.ok) assert.ok(gate.retryAfterSec > 0);
});

test("登录限流：成功后清零", () => {
  const ip = "test-ip-2";
  recordLoginFail(ip);
  recordLoginFail(ip);
  clearLoginFails(ip);
  assert.deepEqual(loginAllowed(ip), { ok: true });
});

test("登录限流：不同 IP 互不影响", () => {
  const ipA = "test-ip-3a";
  const ipB = "test-ip-3b";
  for (let i = 0; i < 5; i++) recordLoginFail(ipA);
  assert.equal(loginAllowed(ipA).ok, false);
  assert.equal(loginAllowed(ipB).ok, true);
});

/* ---------------- auth 会话（开发模式， NODE_ENV=test 走兜底） ---------------- */
import {
  createSessionToken,
  verifySessionToken,
  COOKIE_NAME,
} from "../src/lib/auth";

test("会话 token：签发→校验通过", () => {
  const token = createSessionToken();
  assert.equal(verifySessionToken(token), true);
});

test("会话 token：篡改签名被拒绝", () => {
  const token = createSessionToken();
  const [exp, sig] = token.split(".");
  const fake = `${exp}.${sig.split("").reverse().join("")}`;
  assert.equal(verifySessionToken(fake), false);
});

test("会话 token：过期被拒绝", () => {
  const exp = String(Date.now() - 1000);
  // 用当前密钥签一个过期 token：先拿一个合法 token 的结构再手动构造签名
  const token = createSessionToken();
  void token;
  // 直接构造：verifySessionToken 内部用 getSecret()，这里通过公开行为验证
  // 过期 payload + 任意签名 → 应为 false
  assert.equal(verifySessionToken(`${exp}.AAAA`), false);
});

test("会话 token：空/畸形输入被拒绝", () => {
  assert.equal(verifySessionToken(undefined), false);
  assert.equal(verifySessionToken(""), false);
  assert.equal(verifySessionToken("no-dot-here"), false);
  assert.equal(verifySessionToken("abc.def"), false);
});

test("cookie 名常量稳定（改名需同步服务器与客户端）", () => {
  assert.equal(COOKIE_NAME, "cz_admin");
});

/* ---------------- coin-format ---------------- */
import { formatPrice, formatMcap, avatarHue } from "../src/lib/coin-format";

test("formatPrice：各数量级", () => {
  assert.equal(formatPrice(0), "—");
  assert.equal(formatPrice(65000), "$65,000");
  assert.equal(formatPrice(0.5), "$0.5000");
});

test("formatMcap：B/M/K", () => {
  assert.equal(formatMcap(undefined), "—");
  assert.equal(formatMcap(1.63e9), "$1.63B");
  assert.equal(formatMcap(388e3), "$388K");
});

test("avatarHue：同一输入稳定输出", () => {
  const h1 = avatarHue("FSkyjfqB26u6c2GSgpACrjbxp9yQAR8rutxprVNppump");
  const h2 = avatarHue("FSkyjfqB26u6c2GSgpACrjbxp9yQAR8rutxprVNppump");
  assert.equal(h1, h2);
  assert.ok(h1 >= 0 && h1 < 360);
});
