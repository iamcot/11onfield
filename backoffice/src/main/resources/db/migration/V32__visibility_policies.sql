-- Who may see which group of a player's data. The admin sets the highest level per group (HIDDEN = staff only,
-- PRIVATE = owner + staff, PUBLIC = everyone), a player can only lower it for the groups that allow it.
-- stage_id NULL = the whole competition; a row for a stage overrides it for that round.
CREATE TABLE visibility_policies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT NOT NULL,
    stage_id BIGINT NULL,
    data_group VARCHAR(30) NOT NULL,
    max_level VARCHAR(10) NOT NULL,
    owner_can_hide BOOLEAN NOT NULL DEFAULT TRUE,
    -- a NULL stage is distinct in a MySQL unique key, so the service upserts competition-wide rows itself
    UNIQUE KEY uk_visibility_policy (competition_id, stage_id, data_group),
    CONSTRAINT fk_visibility_policy_competition FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE,
    CONSTRAINT fk_visibility_policy_stage FOREIGN KEY (stage_id) REFERENCES competition_stages (id) ON DELETE CASCADE
);

-- Results of a round go public only after this moment; NULL = not released yet.
ALTER TABLE competition_stages ADD COLUMN results_release_at DATETIME NULL;

CREATE TABLE player_visibility (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    data_group VARCHAR(30) NOT NULL,
    level VARCHAR(10) NOT NULL,
    UNIQUE KEY uk_player_visibility (user_id, data_group),
    CONSTRAINT fk_player_visibility_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
