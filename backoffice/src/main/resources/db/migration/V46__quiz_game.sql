-- Football quiz practice, phase 3: the players' side. Rank climbing, practice by topic, mock exams, leaderboards.
-- The feature switch and the numbers are rows quiz/* of configurations (QuizSettings); the feature starts switched off.

CREATE TABLE quiz_profiles (
    user_id           BIGINT      NOT NULL PRIMARY KEY,
    rank_idx          INT         NOT NULL DEFAULT 0,
    stars             INT         NOT NULL DEFAULT 0,
    guard             TINYINT     NOT NULL DEFAULT 1,
    best_rank_idx     INT         NOT NULL DEFAULT 0,
    streak            INT         NOT NULL DEFAULT 0,
    best_streak       INT         NOT NULL DEFAULT 0,
    answered          INT         NOT NULL DEFAULT 0,
    correct           INT         NOT NULL DEFAULT 0,
    active_attempt_id BIGINT      NULL,
    created_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- One row per question handed out. option_order = the 4 stored options in the order shown ("2013": shown A is
-- stored option 2...), the player answers with the shown position, the right answer never leaves the server before.
CREATE TABLE quiz_attempts (
    id           BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    question_id  BIGINT      NOT NULL,
    mode         VARCHAR(10) NOT NULL,                  -- rank | practice
    option_order CHAR(4)     NOT NULL,
    issued_at    DATETIME(3) NOT NULL,
    expires_at   DATETIME(3) NOT NULL,
    answered_at  DATETIME(3) NULL,
    chosen       TINYINT     NULL,                      -- shown position 0..3
    outcome      VARCHAR(10) NOT NULL DEFAULT 'open',   -- open | correct | wrong | timeout
    flagged      TINYINT     NOT NULL DEFAULT 0,        -- right in under 1.5 s or the page was hidden: not on the boards
    stars_delta  INT         NOT NULL DEFAULT 0,
    KEY idx_quiz_attempts_user (user_id, issued_at),
    KEY idx_quiz_attempts_question (question_id)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Net stars per player and period (W2026-45 ISO week, M2026-11 month); flagged answers never count.
CREATE TABLE quiz_board (
    user_id    BIGINT      NOT NULL,
    period_key VARCHAR(10) NOT NULL,
    stars      INT         NOT NULL DEFAULT 0,
    answered   INT         NOT NULL DEFAULT 0,
    correct    INT         NOT NULL DEFAULT 0,
    updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (period_key, user_id),
    KEY idx_quiz_board_user (user_id)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- A mock exam: N questions at once with a total time, graded when submitted.
CREATE TABLE quiz_mocks (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT       NOT NULL,
    question_ids VARCHAR(1000) NOT NULL,                -- comma separated, in order
    option_order VARCHAR(500)  NOT NULL,                -- comma separated, one 4-digit order per question
    started_at   DATETIME     NOT NULL,
    deadline     DATETIME     NOT NULL,
    finished_at  DATETIME     NULL,
    answers      VARCHAR(500) NULL,                     -- comma separated shown positions, -1 = blank
    score        INT          NULL,
    total        INT          NOT NULL,
    late         TINYINT      NOT NULL DEFAULT 0,
    KEY idx_quiz_mocks_user (user_id, started_at)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
