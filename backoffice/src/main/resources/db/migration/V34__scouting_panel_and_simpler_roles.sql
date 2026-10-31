-- Simpler roles: the scouting panel of a competition is a list of accounts the admin adds (HLV = head coach, the
-- highest on the panel; TTV = scout), instead of global BGK / COORDINATOR roles. Anyone can sign up as a coach or
-- a scout on the website, so the website role alone never grants panel rights.
-- SUPER_USER folds into ADMIN, BGK accounts become scouts on every competition, COORDINATOR becomes a plain user.

CREATE TABLE competition_panel_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    panel_role ENUM('HLV', 'TTV') NOT NULL,
    added_by BIGINT NULL,
    added_at DATETIME NOT NULL,
    UNIQUE KEY uk_panel_member (competition_id, user_id),
    KEY idx_panel_user (user_id),
    CONSTRAINT fk_panel_competition FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE,
    CONSTRAINT fk_panel_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

INSERT INTO competition_panel_members (competition_id, user_id, panel_role, added_at)
SELECT c.id, u.id, 'TTV', NOW()
FROM users u CROSS JOIN competitions c
WHERE u.role = 'BGK';

UPDATE users SET role = 'SCOUTER' WHERE role = 'BGK';
UPDATE users SET role = 'USER' WHERE role = 'COORDINATOR';
UPDATE users SET role = 'ADMIN' WHERE role = 'SUPER_USER';

ALTER TABLE users
    MODIFY COLUMN role ENUM('USER','PLAYER','COACH','SCOUTER','EDITOR','MEDICAL','ADMIN') NOT NULL;
