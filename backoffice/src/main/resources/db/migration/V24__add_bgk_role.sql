-- BGK (Ban giam khao): judges who may only score contestants
ALTER TABLE users
MODIFY COLUMN role ENUM('USER','PLAYER','COACH','SCOUTER','EDITOR','BGK','ADMIN','SUPER_USER') NOT NULL;
