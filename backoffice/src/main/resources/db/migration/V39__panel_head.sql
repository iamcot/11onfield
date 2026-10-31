-- One person decides a selection round: the head of the panel (trưởng hội đồng), one of its HLVs.
-- When nobody is marked, the HLV added first is the head.
ALTER TABLE competition_panel_members ADD COLUMN is_head TINYINT(1) NOT NULL DEFAULT 0;
