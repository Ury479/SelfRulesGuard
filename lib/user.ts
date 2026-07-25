/**
 * 单用户版:固定用户 ID。
 * 所有查询都按 userId 隔离,后续升级多用户时,
 * 只需将此函数替换为从会话中读取真实用户 ID。
 */
export async function getUserId(): Promise<string> {
  return "default-user"
}
