-- Account-wide password-change attempt guard.
--
-- These columns belong to the vendor operator identity, never to a customer's
-- tenant. A row lock in OperatorsService makes five simultaneous failures
-- become five counted failures rather than one overwritten counter.

ALTER TABLE operators
  ADD COLUMN password_change_failures INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN password_change_blocked_until TIMESTAMPTZ;

ALTER TABLE operators
  ADD CONSTRAINT operators_password_change_failures_valid
  CHECK (password_change_failures >= 0 AND password_change_failures <= 5);
