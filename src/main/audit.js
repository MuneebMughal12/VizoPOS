function logAudit(db, userId, action, entity = null, entityId = null, details = null) {
  db.prepare(
    'INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, action, entity, entityId, details);
}

module.exports = { logAudit };
