-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: elevenof_db
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `ward` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_p624vxq0vboah4lfpj88fq8gt` (`user_id`),
  KEY `FK6h32ws7shu7ei7c4dxvm5dyv6` (`province_id`),
  CONSTRAINT `FK1fa36y2oqhao3wgg2rw1pi459` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK6h32ws7shu7ei7c4dxvm5dyv6` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (1,NULL,'2026-04-20 07:37:05.914598','2026-04-20 07:37:05.914608',NULL,2,2),(2,NULL,'2026-04-21 02:46:57.955476','2026-04-21 02:46:57.955487',NULL,2,3),(3,NULL,'2026-04-21 14:50:49.987427','2026-04-21 14:50:49.987432',NULL,2,4),(4,NULL,'2026-04-21 15:26:03.762170','2026-04-21 15:26:03.762174',NULL,2,5),(5,NULL,'2026-04-26 07:03:27.127263','2026-04-26 07:03:27.127268',NULL,34,6),(6,NULL,'2026-04-27 04:24:00.577674','2026-04-27 04:24:00.577683',NULL,26,7),(7,NULL,'2026-04-27 04:36:24.140573','2026-04-27 04:36:24.140587',NULL,2,8),(8,NULL,'2026-04-27 05:10:20.699740','2026-04-27 05:10:20.699745',NULL,2,9),(9,NULL,'2026-04-29 04:28:57.733854','2026-04-29 04:28:57.733860',NULL,2,10),(10,NULL,'2026-05-08 20:30:07.593604','2026-05-08 20:30:07.593618',NULL,2,11),(11,NULL,'2026-05-08 20:33:48.723793','2026-05-08 20:33:48.723801',NULL,2,12),(12,NULL,'2026-05-10 06:44:37.584095','2026-05-10 06:44:37.584122',NULL,2,14),(13,'A35 Bạch Đằng, Tân Bình','2026-05-12 12:37:19.849936','2026-05-12 12:39:25.540826',NULL,2,17),(14,NULL,'2026-05-12 12:52:38.392013','2026-05-12 12:52:38.392040',NULL,2,18),(15,NULL,'2026-05-12 13:02:50.532047','2026-05-12 13:02:50.532063',NULL,5,19),(16,NULL,'2026-05-12 13:17:16.232311','2026-05-12 13:17:16.232333',NULL,2,20),(17,NULL,'2026-05-13 09:19:03.363520','2026-05-13 09:19:03.363532',NULL,2,24),(18,NULL,'2026-05-13 16:28:04.486783','2026-05-13 16:28:04.486809',NULL,1,27),(19,'A35 Bạch Đằng, Tân Bình','2026-05-17 12:29:15.505166','2026-05-17 12:31:58.747423',NULL,2,29),(20,NULL,'2026-05-17 19:54:13.568374','2026-05-17 19:54:13.568399',NULL,2,31),(21,'16/2A ấp Hưng Lân, xã Bà Điểm,huyện Hóc Môn','2026-05-17 22:10:18.451079','2026-05-17 22:20:35.186614',NULL,2,32),(22,NULL,'2026-05-18 15:45:59.269567','2026-05-18 15:45:59.269588',NULL,1,36),(29,NULL,'2026-05-18 16:29:21.937368','2026-05-18 16:29:21.937375',NULL,2,37),(30,NULL,'2026-05-22 12:36:30.880423','2026-05-22 12:36:30.880429',NULL,2,39),(31,'56 Hồ Văn Huê Phường Đức Nhuận TPHCM','2026-05-22 12:56:37.903387','2026-05-22 13:02:49.919056',NULL,2,40),(32,NULL,'2026-05-26 16:46:46.106880','2026-05-26 16:46:46.106886',NULL,2,41),(33,NULL,'2026-05-28 12:43:57.461442','2026-05-28 12:43:57.461448',NULL,2,42),(34,NULL,'2026-05-30 17:35:04.028604','2026-05-30 17:35:04.028628',NULL,1,22),(35,NULL,'2026-06-01 12:14:19.389701','2026-06-01 12:14:19.389715',NULL,2,43);
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coaches`
--

DROP TABLE IF EXISTS `coaches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coaches` (
  `id` bigint NOT NULL,
  `certifications` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `specialization` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `years_of_experience` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FKbyei1g9vs5d057vur8psubw3x` FOREIGN KEY (`id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coaches`
--

LOCK TABLES `coaches` WRITE;
/*!40000 ALTER TABLE `coaches` DISABLE KEYS */;
/*!40000 ALTER TABLE `coaches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configurations`
--

DROP TABLE IF EXISTS `configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configurations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `config_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_cbn5hq7vdkvi6kl3aipl5cuww` (`config_key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configurations`
--

LOCK TABLES `configurations` WRITE;
/*!40000 ALTER TABLE `configurations` DISABLE KEYS */;
INSERT INTO `configurations` VALUES (1,'2026-05-03 14:38:13.543945','Zalo ZNS OAuth tokens (access token: 25h, refresh token: 3 months single-use)','ZNS_TOKEN','2026-05-16 21:16:55.657224','{\"accessToken\":\"38n0BVrv6X8BZaGb-7uP6mo1Hod-Q4Hd3laV59LnE6TYqcOhcsCxIJZT6HkwAYHK5RWW9xeuAX0pdNfPbMb0RMRjOHl_TLbfRji25-n58IPCn2WKocmfIcNi5IcMGJ8SCDPkU9HaIJi5aNK4eG1IC0cpObcOG6Sk4i0uJRH4PIWIzKuVW5fXIZZOGJh8AHfsFA424gKp3K8TcZCgbXKKOmtgEIEkHnr2FDf62iLrR5L-nN5YsKTE1dRlPMB4S4m_OUviTVfXKY5Dprvq-db_7rNPP7ljQ6iIQC17GkH5UJHIx5zIubm7R5hpMpFKV7fQLzfeAVnPC61Sx1mHzrirNL2j13JhCZHzRRGFJyCNK7njaMiMtZHEUL21SmZ18rP7TTHK5uKaPIOkq49JZdHSOm7X1oYPHo1sPS77Q0VvPHeQ\",\"refreshToken\":\"z4qW6sHGWZFpJoGJOLU1ElH09nzdGT55XIiO74zyi3ckAn9JIrlA2euh27PNJUzVaYP8Fr1jkHwg1t5-FaFLNRCe3XX5Jzn1X2jz46jzm5EC2nLnHNltExTv25z7OAi8r2TnSXD-gYZmC75-PLcIBAi1L7P70viek4vJLN8KXJ6rNqHbPI7cEOev8bvvNC0adZGIK51CxYAKL0j1LJJE6gDQRrin3RDxtKPfE2eeadx6O59UCXcXBFbUQNOi1RzKu0TyF3HHgHlv96fVO3wD08nNLs1P3Bv3gn1P8aSDWLQuPs4nBnZ1PznG5JGOH-fjqLyJ43SOwq_dNZ8x1a7sUP0t7Zm9MiXzpoCyAGXXratA1o0y84hSLROr0tOWSzWUo0a5Hpb_ymRt5b5xOs7pBA0la11WJ88x\",\"expiresAt\":1779031015}');
/*!40000 ALTER TABLE `configurations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_joined`
--

DROP TABLE IF EXISTS `event_joined`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_joined` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `event_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKcgc7x369hrbksuibqpoempl1p` (`user_id`,`event_id`),
  KEY `FKqu8qltmeqjox905q8idbpmlox` (`event_id`),
  CONSTRAINT `FK5l9mga8s6lphn24e6qcg7nh96` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKqu8qltmeqjox905q8idbpmlox` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_joined`
--

LOCK TABLES `event_joined` WRITE;
/*!40000 ALTER TABLE `event_joined` DISABLE KEYS */;
INSERT INTO `event_joined` VALUES (1,'2026-04-27 03:14:49.373504',1,2),(2,'2026-04-27 04:44:11.292517',1,6),(3,'2026-05-12 12:42:52.184509',1,17);
/*!40000 ALTER TABLE `event_joined` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL,
  `end_date` date NOT NULL,
  `end_time` time(6) DEFAULT NULL,
  `location` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `picture` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `short_content` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date NOT NULL,
  `start_time` time(6) DEFAULT NULL,
  `status` enum('PLAN','OPEN_REGISTER','CLOSE_REGISTER','COMPLETE','CANCELLED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `province_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKkcqj0y04udxyf1x80han32ed7` (`province_id`),
  CONSTRAINT `FKkcqj0y04udxyf1x80han32ed7` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'<p>Họp b&aacute;o ra mắt gameshow truyền h&igrave;nh thực tế 11 người ra s&acirc;n</p>\r\n<p>Họp b&aacute;o ra mắt gameshow truyền h&igrave;nh thực tế 11 người ra s&acirc;n</p>\r\n<p><img src=\"https://11of.s3.ap-southeast-1.amazonaws.com/events/event_0_1777262077768_5f510239.png\" alt=\"\" width=\"814\" height=\"605\"></p>\r\n<p>Họp b&aacute;o ra mắt gameshow truyền h&igrave;nh thực tế 11 người ra s&acirc;n</p>','2026-04-27 03:14:05.105001','2026-05-08','17:00:00.000000','Nhà thi đấu TP Hồ Chí Minh','https://11of.s3.ap-southeast-1.amazonaws.com/events/event_1_1777259645165_397c60e3.png','Họp báo ra mắt gameshow truyền hình thực tế 11 người ra sân','2026-05-08','09:00:00.000000','DELETED','Họp báo ra mắt gameshow 11 on field - 11 người ra sân','2026-05-17 21:35:59.686303',2);
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flyway_schema_history`
--

DROP TABLE IF EXISTS `flyway_schema_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `script` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flyway_schema_history`
--

LOCK TABLES `flyway_schema_history` WRITE;
/*!40000 ALTER TABLE `flyway_schema_history` DISABLE KEYS */;
INSERT INTO `flyway_schema_history` VALUES (1,'15','<< Flyway Baseline >>','BASELINE','<< Flyway Baseline >>',NULL,'elevenof','2026-05-17 12:18:54',0,1);
/*!40000 ALTER TABLE `flyway_schema_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follows`
--

DROP TABLE IF EXISTS `follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follows` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `followed_id` bigint NOT NULL,
  `follower_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKd6wgm6dc6dkw9knsxjkt1qk87` (`follower_id`,`followed_id`),
  KEY `FK45sy1jkos9oy1j4by9y7225nm` (`followed_id`),
  CONSTRAINT `FK45sy1jkos9oy1j4by9y7225nm` FOREIGN KEY (`followed_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKqnkw0cwwh6572nyhvdjqlr163` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follows`
--

LOCK TABLES `follows` WRITE;
/*!40000 ALTER TABLE `follows` DISABLE KEYS */;
INSERT INTO `follows` VALUES (3,'2026-04-26 13:56:49.021048',3,2),(5,'2026-05-16 21:44:08.670494',17,2);
/*!40000 ALTER TABLE `follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_scenarios`
--

DROP TABLE IF EXISTS `notification_scenarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_scenarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `email_enabled` bit(1) NOT NULL,
  `inapp_enabled` bit(1) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scenario_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `zns_enabled` bit(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_lyttb5gttk3rmosxftex6nlom` (`scenario_key`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_scenarios`
--

LOCK TABLES `notification_scenarios` WRITE;
/*!40000 ALTER TABLE `notification_scenarios` DISABLE KEYS */;
INSERT INTO `notification_scenarios` VALUES (1,'2026-05-17 11:49:11.611365','Gửi email chào mừng khi người dùng điền email lần đầu',_binary '',_binary '','Chào mừng','WELCOME_EMAIL','2026-05-17 21:17:50.852552',_binary '\0'),(2,'2026-05-17 11:49:11.611365','Thông báo khi admin duyệt thành tích của cầu thủ',_binary '\0',_binary '','Thành tích được duyệt','ACHIEVEMENT_APPROVED','2026-06-01 12:21:45.345940',_binary '\0'),(3,'2026-05-17 11:49:11.611365','Thông báo khi admin duyệt highlight của cầu thủ',_binary '\0',_binary '','Highlight được duyệt','HIGHLIGHT_APPROVED','2026-06-01 12:03:43.836124',_binary '\0'),(4,'2026-05-17 11:49:11.611365','Xác nhận khi người dùng đăng ký tham gia sự kiện',_binary '\0',_binary '','Xác nhận tham gia sự kiện','EVENT_JOINED','2026-06-01 12:03:46.919269',_binary '\0'),(5,'2026-05-17 11:49:11.611365','Thông báo khi có người theo dõi mới',_binary '\0',_binary '','Người theo dõi mới','NEW_FOLLOWER','2026-06-01 12:03:48.836131',_binary '\0'),(6,'2026-05-17 11:49:36.751950','Thông báo khi admin xác minh tài khoản cầu thủ',_binary '\0',_binary '','Tài khoản đã xác minh','ACCOUNT_VERIFIED','2026-06-01 12:03:52.100558',_binary '\0');
/*!40000 ALTER TABLE `notification_scenarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_templates`
--

DROP TABLE IF EXISTS `notification_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_templates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `body_template` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('EMAIL','INAPP','ZNS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `variables` json DEFAULT NULL,
  `scenario_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKjt1s8boo8sqow466oi6wru03f` (`scenario_id`),
  CONSTRAINT `FKjt1s8boo8sqow466oi6wru03f` FOREIGN KEY (`scenario_id`) REFERENCES `notification_scenarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_templates`
--

LOCK TABLES `notification_templates` WRITE;
/*!40000 ALTER TABLE `notification_templates` DISABLE KEYS */;
INSERT INTO `notification_templates` VALUES (1,_binary '','<p>Chào mừng bạn đến với <strong>11 ON FIELD</strong> - nơi tìm kiếm và kết nối những tài năng bóng đá trẻ Việt Nam.</p> <p style=\"font-size: 18px; font-weight: bold; color: #0B5CAB;\"> ⚽ BƯỚC TIẾP THEO: HOÀN THIỆN HỒ SƠ CẦU THỦ CỦA BẠN! </p> <p>Email của bạn <strong>{{email}}</strong> đã được xác nhận thành công. Để được Ban Tổ Chức xem xét trong vòng lọc hồ sơ online, bạn vui lòng cập nhật đầy đủ thông tin cầu thủ trên hệ thống.</p> <p>Các thông tin nên hoàn thiện gồm:</p> <ul> <li>Thông tin cá nhân</li> <li>Chiều cao, cân nặng, vị trí thi đấu</li> <li>Thành tích cá nhân/tập thể</li> <li>Video highlight</li> <li>Liên kết mạng xã hội nếu có</li> </ul> <p><strong>Hồ sơ càng đầy đủ, cơ hội được đánh giá chính xác càng cao.</strong></p> <p>Trân trọng,<br> <strong>Ban Tổ Chức 11 ON FIELD</strong></p> <p> Email hỗ trợ: 11nguoirasan@11onfield.com<br> Hotline/Zalo: 090 2383 511<br> Tuyển trạch trên toàn quốc </p>','EMAIL','2026-05-17 11:49:11.715731','Chào mừng bạn đến với 11 On Field!','2026-06-01 12:26:28.117265','[\"fullName\", \"email\"]',1),(2,_binary '','Xin chào {{fullName}}! Email {{email}} của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!','INAPP','2026-05-17 11:49:11.804688','Chào mừng bạn đến với 11 On Field!','2026-05-17 11:49:11.804688','[\"fullName\", \"email\"]',1),(3,_binary '','Chúc mừng {{fullName}}! Highlight \"{{highlightDescription}}\" của bạn đã được admin duyệt.','INAPP','2026-05-17 11:49:11.819572','Thành tích của bạn đã được phê duyệt','2026-06-01 12:21:39.733375','[\"fullName\", \"achievementTitle\"]',2),(4,_binary '','Chuc mung {{fullName}}! Thanh tich \"{{achievementTitle}}\" cua ban da duoc duyet.','ZNS','2026-05-17 11:49:11.925823','','2026-05-17 11:49:11.925823','[\"fullName\", \"achievementTitle\"]',2),(5,_binary '','Chúc mừng {{fullName}}! Highlight \"{{highlightDescription}}\" của bạn đã được admin duyệt.','INAPP','2026-05-17 11:49:11.940451','Highlight được duyệt','2026-05-17 11:49:11.940451','[\"fullName\", \"highlightDescription\"]',3),(6,_binary '','Chuc mung {{fullName}}! Highlight cua ban da duoc duyet.','ZNS','2026-05-17 11:49:11.952641','','2026-05-17 11:49:11.952641','[\"fullName\", \"highlightDescription\"]',3),(7,_binary '','Xin chào {{fullName}}! Bạn đã đăng ký tham gia sự kiện \"{{eventTitle}}\" vào ngày {{eventDate}}. Chúng tôi sẽ gửi thông báo nhắc nhở trước khi sự kiện diễn ra.','INAPP','2026-05-17 11:49:12.006764','Xác nhận tham gia sự kiện','2026-05-17 11:49:12.006764','[\"fullName\", \"eventTitle\", \"eventDate\"]',4),(8,_binary '','{{followerName}} (@{{followerUserid}}) đã bắt đầu theo dõi bạn!','INAPP','2026-05-17 11:49:13.092132','Người theo dõi mới','2026-05-17 11:49:13.092132','[\"followerName\", \"followerUserid\"]',5),(9,_binary '','Chúc mừng {{fullName}}! Tài khoản của bạn đã được admin xác minh. Bạn có thể sử dụng đầy đủ các tính năng của nền tảng.','INAPP','2026-05-17 11:49:36.764986','Tài khoản đã được xác minh','2026-05-17 11:49:36.764986','[\"fullName\"]',6);
/*!40000 ALTER TABLE `notification_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `channel` enum('EMAIL','INAPP','ZNS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `data` json DEFAULT NULL,
  `is_read` bit(1) NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `scenario_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9y21adhxn0ayjhfocscqox7bh` (`user_id`),
  CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'INAPP','2026-05-17 19:58:22.616760','{\"achievementId\": 62}',_binary '','Chúc mừng Thắng Trương ! Thành tích \"QBV U10\" của bạn đã được admin duyệt và hiển thị trên hồ sơ.','2026-05-17 20:00:30.847819','ACHIEVEMENT_APPROVED','Thành tích được duyệt',2),(2,'INAPP','2026-05-17 20:01:06.254263','{\"achievementId\": 63}',_binary '','Chúc mừng Thắng Trương ! Thành tích \"U15 2026\" của bạn đã được admin duyệt và hiển thị trên hồ sơ.','2026-05-17 20:19:48.223339','ACHIEVEMENT_APPROVED','Thành tích được duyệt',2),(3,'INAPP','2026-05-17 20:20:10.272972',NULL,_binary '','Chúc mừng Thắng Trương ! Tài khoản của bạn đã được admin xác minh. Bạn có thể sử dụng đầy đủ các tính năng của nền tảng.','2026-05-17 21:34:13.009303','ACCOUNT_VERIFIED','Tài khoản đã được xác minh',2),(4,'INAPP','2026-05-17 20:20:59.879793','{\"achievementId\": 66}',_binary '','Chúc mừng Thắng Trương ! Thành tích \"QBV U10\" của bạn đã được admin duyệt và hiển thị trên hồ sơ.','2026-05-17 21:34:13.009303','ACHIEVEMENT_APPROVED','Thành tích được duyệt',2),(5,'INAPP','2026-05-17 20:21:20.088283','{\"achievementId\": 67}',_binary '','Chúc mừng Thắng Trương ! Thành tích \"U15 2026\" của bạn đã được admin duyệt và hiển thị trên hồ sơ.','2026-05-17 21:34:13.009303','ACHIEVEMENT_APPROVED','Thành tích được duyệt',2),(6,'INAPP','2026-05-17 21:31:23.875996',NULL,_binary '','Chúc mừng Thắng Trương ! Tài khoản của bạn đã được admin xác minh. Bạn có thể sử dụng đầy đủ các tính năng của nền tảng.','2026-05-17 21:34:13.009303','ACCOUNT_VERIFIED','Tài khoản đã được xác minh',2),(7,'INAPP','2026-05-17 22:10:18.458734',NULL,_binary '','Xin chào Lê Thanh Bình! Email lethanhbinh181201@gmail.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!','2026-05-17 22:24:19.044370','WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',32),(8,'INAPP','2026-05-18 15:45:59.271208',NULL,_binary '\0','Xin chào Đầu Hoàng Quân! Email luongquyen16987@gmai.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!',NULL,'WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',36),(9,'INAPP','2026-05-18 16:21:49.140836','{\"achievementId\": 72}',_binary '\0','Chúc mừng Lê Thanh Bình! Thành tích \"U15 toàn quốc 2024,2025\" của bạn đã được admin duyệt và hiển thị trên hồ sơ.',NULL,'ACHIEVEMENT_APPROVED','Thành tích được duyệt',32),(10,'INAPP','2026-05-18 16:21:50.075745','{\"achievementId\": 73}',_binary '\0','Chúc mừng Lê Thanh Bình! Thành tích \"U17 2025 2026\" của bạn đã được admin duyệt và hiển thị trên hồ sơ.',NULL,'ACHIEVEMENT_APPROVED','Thành tích được duyệt',32),(11,'INAPP','2026-05-18 16:26:13.586071',NULL,_binary '\0','Xin chào Vũ Minh Tuấn! Email vu051431@gmail.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!',NULL,'WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',37),(12,'INAPP','2026-05-18 16:26:23.375292',NULL,_binary '\0','Xin chào Vũ Minh Tuấn! Email vu051431@gmail.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!',NULL,'WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',37),(13,'INAPP','2026-05-18 16:26:36.728866',NULL,_binary '\0','Xin chào Vũ Minh Tuấn! Email vucole816@gmail.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!',NULL,'WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',37),(14,'INAPP','2026-05-18 16:27:00.205378',NULL,_binary '\0','Xin chào Vũ Minh Tuấn! Email vucole816@gmail.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!',NULL,'WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',37),(15,'INAPP','2026-05-18 16:28:12.397472',NULL,_binary '\0','Xin chào Vũ Minh Tuấn! Email vucole816@gmail.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!',NULL,'WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',37),(16,'INAPP','2026-05-18 16:29:06.208040',NULL,_binary '\0','Xin chào Vũ Minh Tuấn! Email vucole816@gmail.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!',NULL,'WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',37),(17,'INAPP','2026-05-18 16:29:21.942107',NULL,_binary '\0','Xin chào Vũ Minh Tuấn! Email vucole816@gmail.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!',NULL,'WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',37),(18,'INAPP','2026-05-18 16:30:21.766501','{\"achievementId\": 88}',_binary '\0','Chúc mừng Vũ Minh Tuấn! Thành tích \"Vua phá lưới U18\" của bạn đã được admin duyệt và hiển thị trên hồ sơ.',NULL,'ACHIEVEMENT_APPROVED','Thành tích được duyệt',37),(19,'INAPP','2026-05-18 16:30:22.958097','{\"achievementId\": 89}',_binary '\0','Chúc mừng Vũ Minh Tuấn! Thành tích \"HCV giải bóng đá toàn quốc\" của bạn đã được admin duyệt và hiển thị trên hồ sơ.',NULL,'ACHIEVEMENT_APPROVED','Thành tích được duyệt',37),(20,'INAPP','2026-05-18 16:30:24.797983','{\"highlightId\": 30}',_binary '\0','Chúc mừng Vũ Minh Tuấn! Highlight \"Video highlight\" của bạn đã được admin duyệt.',NULL,'HIGHLIGHT_APPROVED','Highlight được duyệt',37),(21,'INAPP','2026-05-22 12:36:30.883241',NULL,_binary '','Xin chào Phùng Tuệ Nguyên! Email phungtaiphau@gmail.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!','2026-05-22 12:36:53.847377','WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',39),(22,'INAPP','2026-05-22 13:02:49.912163',NULL,_binary '','Xin chào Phùng Tuệ Nguyên! Email phungtaiphau@gmail.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!','2026-05-22 13:04:06.241439','WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',40),(23,'INAPP','2026-05-30 17:35:04.139371',NULL,_binary '\0','Xin chào thang 5! Email thang102@gmail.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!',NULL,'WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',22),(24,'INAPP','2026-06-01 12:14:19.446021',NULL,_binary '\0','Xin chào Vũ Minh Tuấn! Email vu051431@gmail.com của bạn đã được xác nhận. Chúc bạn có những trải nghiệm tuyệt vời!',NULL,'WELCOME_EMAIL','Chào mừng bạn đến với 11 On Field!',43),(25,'INAPP','2026-06-01 12:19:56.305225','{\"achievementId\": 93}',_binary '\0','<p>Ban Tổ Chức 11 ON FIELD thông báo thành tích của bạn đã được kiểm tra và phê duyệt trên hệ thống.</p> <p style=\"font-size: 18px; font-weight: bold; color: #0B8A3D;\"> 🏆 THÀNH TÍCH \"Vua phá lưới FI Championship\" ĐÃ ĐƯỢC PHÊ DUYỆT! </p> <p>Thành tích này sẽ được hiển thị trên hồ sơ cầu thủ của bạn, giúp Ban Tổ Chức có thêm cơ sở để đánh giá quá trình thi đấu và tiềm năng của bạn.</p> <p>Bạn có thể tiếp tục cập nhật thêm các thành tích khác nếu có để hồ sơ nổi bật hơn.</p> <p>Trân trọng,<br> <strong>Ban Tổ Chức 11 ON FIELD</strong></p> <p> Email hỗ trợ: 11nguoirasan@11onfield.com<br> Hotline/Zalo: 090 2383 511<br> Tuyển trạch trên toàn quốc </p>',NULL,'ACHIEVEMENT_APPROVED','Thành tích của bạn đã được phê duyệt',43),(26,'INAPP','2026-06-01 12:19:57.633907','{\"achievementId\": 94}',_binary '\0','<p>Ban Tổ Chức 11 ON FIELD thông báo thành tích của bạn đã được kiểm tra và phê duyệt trên hệ thống.</p> <p style=\"font-size: 18px; font-weight: bold; color: #0B8A3D;\"> 🏆 THÀNH TÍCH \"HCV Seri B Gấu Family FI Championship\" ĐÃ ĐƯỢC PHÊ DUYỆT! </p> <p>Thành tích này sẽ được hiển thị trên hồ sơ cầu thủ của bạn, giúp Ban Tổ Chức có thêm cơ sở để đánh giá quá trình thi đấu và tiềm năng của bạn.</p> <p>Bạn có thể tiếp tục cập nhật thêm các thành tích khác nếu có để hồ sơ nổi bật hơn.</p> <p>Trân trọng,<br> <strong>Ban Tổ Chức 11 ON FIELD</strong></p> <p> Email hỗ trợ: 11nguoirasan@11onfield.com<br> Hotline/Zalo: 090 2383 511<br> Tuyển trạch trên toàn quốc </p>',NULL,'ACHIEVEMENT_APPROVED','Thành tích của bạn đã được phê duyệt',43);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_verifications`
--

DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attempts` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `otp_code` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `verified` bit(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verifications`
--

LOCK TABLES `otp_verifications` WRITE;
/*!40000 ALTER TABLE `otp_verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `otp_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `used` bit(1) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_71lqwbwtklmljk3qlsugr1mig` (`token`),
  KEY `FKk3ndxg5xp6v7wd4gjyusp15gq` (`user_id`),
  CONSTRAINT `FKk3ndxg5xp6v7wd4gjyusp15gq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_achievements`
--

DROP TABLE IF EXISTS `player_achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_achievements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `achievement_date` date DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `title` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('INDIVIDUAL','TEAM','PARTICIPANT') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Achievement type',
  `updated_at` datetime(6) NOT NULL,
  `player_id` bigint NOT NULL,
  `approval_status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKji7pw2gbmgcorbmxuhtl3v750` (`player_id`),
  CONSTRAINT `FKji7pw2gbmgcorbmxuhtl3v750` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_achievements`
--

LOCK TABLES `player_achievements` WRITE;
/*!40000 ALTER TABLE `player_achievements` DISABLE KEYS */;
INSERT INTO `player_achievements` VALUES (4,'2018-05-09','2026-05-12 12:45:27.816645',NULL,'HCB Festival Bóng đá học đường','TEAM','2026-05-12 12:45:27.816645',17,'PENDING'),(5,'2024-04-29','2026-05-12 22:53:14.416830',NULL,'vpl 2024','INDIVIDUAL','2026-05-12 22:53:14.416830',23,'PENDING'),(6,'2026-04-29','2026-05-12 22:53:14.433535',NULL,'HCV trer 2026','TEAM','2026-05-12 22:53:14.433535',23,'PENDING'),(20,'2026-05-04','2026-05-16 21:20:19.601918',NULL,'Vua phá lưới','INDIVIDUAL','2026-05-16 21:20:19.601918',24,'PENDING'),(21,'2026-05-10','2026-05-16 21:20:19.605363',NULL,'HCV giải bóng đá sinh viên toàn quốc','TEAM','2026-05-16 21:20:19.605363',24,'PENDING'),(56,'2024-05-05','2026-05-17 14:04:21.168742',NULL,'Vua phá lưới U18 quốc gia','INDIVIDUAL','2026-05-17 14:04:21.168742',29,'PENDING'),(57,'2024-05-14','2026-05-17 14:04:21.173244',NULL,'HCV Hội Khỏe Phù Đổng ','TEAM','2026-05-17 14:04:21.173244',29,'PENDING'),(58,'2024-05-05','2026-05-17 14:04:21.178789',NULL,'Giải bóng đá U18 toàn quốc','PARTICIPANT','2026-05-17 14:04:21.178789',29,'PENDING'),(59,'2023-05-09','2026-05-17 14:04:21.181107',NULL,'U15 toàn quốc','PARTICIPANT','2026-05-17 14:04:21.181107',29,'PENDING'),(68,'2022-12-21','2026-05-17 20:21:41.669257',NULL,'QBV U10','INDIVIDUAL','2026-05-17 20:21:41.669257',2,'PENDING'),(69,'2026-04-25','2026-05-17 20:21:41.679112',NULL,'U15 2026','PARTICIPANT','2026-05-17 20:21:41.679112',2,'PENDING'),(74,'2025-06-20','2026-05-18 16:21:59.773317',NULL,'U15 toàn quốc 2024,2025','PARTICIPANT','2026-05-18 16:21:59.773317',32,'APPROVED'),(75,'2025-08-24','2026-05-18 16:21:59.777331',NULL,'U17 2025 2026','PARTICIPANT','2026-05-18 16:21:59.777331',32,'APPROVED'),(90,'2025-05-10','2026-05-18 16:30:27.701614',NULL,'Vua phá lưới U18','INDIVIDUAL','2026-05-18 16:30:27.701614',37,'APPROVED'),(91,'2026-05-17','2026-05-18 16:30:27.706065',NULL,'HCV giải bóng đá toàn quốc','TEAM','2026-05-18 16:30:27.706065',37,'APPROVED'),(95,'2023-06-05','2026-06-01 12:20:09.409715',NULL,'Vua phá lưới FI Championship','INDIVIDUAL','2026-06-01 12:20:09.409715',43,'APPROVED'),(96,'2023-06-06','2026-06-01 12:20:09.413481',NULL,'HCV Seri B Gấu Family FI Championship','TEAM','2026-06-01 12:20:09.413481',43,'APPROVED');
/*!40000 ALTER TABLE `player_achievements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_attribute_types`
--

DROP TABLE IF EXISTS `player_attribute_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_attribute_types` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attribute_group` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attribute_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attribute_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_goal_keeper` bit(1) NOT NULL,
  `is_hexagon` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_l0jw4pprn4e4ao0pa4u4e9ebl` (`attribute_key`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_attribute_types`
--

LOCK TABLES `player_attribute_types` WRITE;
/*!40000 ALTER TABLE `player_attribute_types` DISABLE KEYS */;
INSERT INTO `player_attribute_types` VALUES (1,'physical','pac','Tốc độ','2026-04-26 17:08:22.145273','admin',_binary '\0',_binary '','2026-04-27 03:00:54.917016','admin'),(2,'technical','sho','Sút bóng','2026-04-26 17:08:38.413496','admin',_binary '\0',_binary '','2026-04-27 03:01:00.044100','admin'),(3,'tactical','pas','Chuyền bóng','2026-04-26 17:08:50.974496','admin',_binary '\0',_binary '','2026-04-27 03:01:05.780874','admin'),(4,'technical','dri','Rê bóng','2026-04-26 17:09:06.659224','admin',_binary '\0',_binary '','2026-04-27 03:01:11.230262','admin'),(5,'tactical','def','Phòng thủ','2026-04-26 17:09:33.503218','admin',_binary '\0',_binary '','2026-04-27 03:01:18.233599','admin'),(6,'physical','phy','Sức mạnh','2026-04-26 17:09:46.284731','admin',_binary '\0',_binary '','2026-04-27 03:01:23.293627','admin'),(7,'synthetic_physical','FIT','Thể chất','2026-05-16 14:10:10.000000','SYSTEM',_binary '\0',_binary '\0','2026-05-16 14:10:10.000000',NULL),(8,'synthetic_experience','EXP','Kinh nghiệm','2026-05-16 14:10:10.000000','SYSTEM',_binary '\0',_binary '\0','2026-05-16 14:10:10.000000',NULL),(9,'synthetic_skills','SKL','Kỹ năng','2026-05-16 14:10:10.000000','SYSTEM',_binary '\0',_binary '\0','2026-05-16 14:10:10.000000',NULL),(10,'synthetic_profile','PRF','Hoàn thiện profile','2026-05-16 14:10:10.000000','SYSTEM',_binary '\0',_binary '\0','2026-05-16 14:10:10.000000',NULL),(11,'synthetic_achievement','ACH','Thành tích','2026-05-16 14:10:10.000000','SYSTEM',_binary '\0',_binary '\0','2026-05-16 14:10:10.000000',NULL),(12,'synthetic_highlight','HLT','Highlights','2026-05-16 14:10:10.000000','SYSTEM',_binary '\0',_binary '\0','2026-05-16 14:10:10.000000',NULL);
/*!40000 ALTER TABLE `player_attribute_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_attributes`
--

DROP TABLE IF EXISTS `player_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_attributes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attribute_value` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attribute_type_id` bigint NOT NULL,
  `player_id` bigint NOT NULL,
  `generation_timestamp` datetime(6) DEFAULT NULL,
  `is_synthetic` bit(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKpcp7nb3ny9if5um6js19lkulf` (`player_id`,`attribute_type_id`),
  KEY `FKei0h9ahk3mrnk27lxh9ay17dt` (`attribute_type_id`),
  KEY `idx_attribute_is_synthetic` (`player_id`,`is_synthetic`),
  CONSTRAINT `FK5p4dpywpd7e5bpd53s5f2wxfi` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
  CONSTRAINT `FKei0h9ahk3mrnk27lxh9ay17dt` FOREIGN KEY (`attribute_type_id`) REFERENCES `player_attribute_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_attributes`
--

LOCK TABLES `player_attributes` WRITE;
/*!40000 ALTER TABLE `player_attributes` DISABLE KEYS */;
INSERT INTO `player_attributes` VALUES (1,85,'2026-04-26 17:10:44.005621','admin','2026-04-26 17:10:44.005648','admin',1,2,NULL,_binary '\0'),(2,97,'2026-04-26 17:10:44.017198','admin','2026-04-26 17:10:44.017218','admin',2,2,NULL,_binary '\0'),(3,90,'2026-04-26 17:10:44.029692','admin','2026-04-26 17:10:44.029711','admin',3,2,NULL,_binary '\0'),(4,73,'2026-04-26 17:10:44.039388','admin','2026-04-26 17:10:44.039404','admin',4,2,NULL,_binary '\0'),(5,45,'2026-04-26 17:10:44.048109','admin','2026-04-26 17:10:44.048151','admin',5,2,NULL,_binary '\0'),(6,64,'2026-04-26 17:10:44.056336','admin','2026-04-26 17:10:44.056369','admin',6,2,NULL,_binary '\0'),(7,67,'2026-04-27 04:01:31.876830','admin','2026-04-27 04:01:31.876880','admin',1,3,NULL,_binary '\0'),(8,73,'2026-04-27 04:01:31.924129','admin','2026-04-27 04:01:31.924145','admin',2,3,NULL,_binary '\0'),(9,74,'2026-04-27 04:01:31.932914','admin','2026-04-27 04:01:31.932928','admin',3,3,NULL,_binary '\0'),(10,68,'2026-04-27 04:01:31.940168','admin','2026-04-27 04:01:31.940181','admin',4,3,NULL,_binary '\0'),(11,84,'2026-04-27 04:01:31.946954','admin','2026-04-27 04:01:31.946967','admin',5,3,NULL,_binary '\0'),(12,72,'2026-04-27 04:01:31.954639','admin','2026-04-27 04:01:31.954656','admin',6,3,NULL,_binary '\0'),(13,70,'2026-05-16 21:11:02.317738','admin','2026-05-16 21:11:02.317759','admin',7,7,'2026-05-16 21:11:02.295884',_binary ''),(14,20,'2026-05-16 21:11:02.365145','admin','2026-05-16 21:11:02.365163','admin',12,7,'2026-05-16 21:11:02.295884',_binary ''),(15,70,'2026-05-16 21:11:02.400461','admin','2026-05-16 21:11:02.400475','admin',9,7,'2026-05-16 21:11:02.295884',_binary ''),(16,50,'2026-05-16 21:11:02.423574','admin','2026-05-16 21:11:02.423587','admin',10,7,'2026-05-16 21:11:02.295884',_binary ''),(17,20,'2026-05-16 21:11:02.443082','admin','2026-05-16 21:11:02.443094','admin',11,7,'2026-05-16 21:11:02.295884',_binary ''),(18,20,'2026-05-16 21:11:02.455709','admin','2026-05-16 21:11:02.455735','admin',8,7,'2026-05-16 21:11:02.295884',_binary ''),(19,50,'2026-05-16 21:11:02.471104','admin','2026-05-16 21:11:02.471119','admin',7,10,'2026-05-16 21:11:02.465157',_binary ''),(20,20,'2026-05-16 21:11:02.478984','admin','2026-05-16 21:11:02.479002','admin',12,10,'2026-05-16 21:11:02.465157',_binary ''),(21,70,'2026-05-16 21:11:02.486297','admin','2026-05-16 21:11:02.486308','admin',9,10,'2026-05-16 21:11:02.465157',_binary ''),(22,41,'2026-05-16 21:11:02.493392','admin','2026-05-16 21:11:02.493403','admin',10,10,'2026-05-16 21:11:02.465157',_binary ''),(23,20,'2026-05-16 21:11:02.500558','admin','2026-05-16 21:11:02.500570','admin',11,10,'2026-05-16 21:11:02.465157',_binary ''),(24,20,'2026-05-16 21:11:02.507849','admin','2026-05-16 21:11:02.507860','admin',8,10,'2026-05-16 21:11:02.465157',_binary ''),(25,50,'2026-05-16 21:11:02.522328','admin','2026-05-16 21:11:02.522343','admin',7,12,'2026-05-16 21:11:02.516356',_binary ''),(26,20,'2026-05-16 21:11:02.529440','admin','2026-05-16 21:11:02.529451','admin',12,12,'2026-05-16 21:11:02.516356',_binary ''),(27,70,'2026-05-16 21:11:02.536257','admin','2026-05-16 21:11:02.536269','admin',9,12,'2026-05-16 21:11:02.516356',_binary ''),(28,33,'2026-05-16 21:11:02.543288','admin','2026-05-16 21:11:02.543302','admin',10,12,'2026-05-16 21:11:02.516356',_binary ''),(29,20,'2026-05-16 21:11:02.550170','admin','2026-05-16 21:11:02.550181','admin',11,12,'2026-05-16 21:11:02.516356',_binary ''),(30,20,'2026-05-16 21:11:02.557018','admin','2026-05-16 21:11:02.557028','admin',8,12,'2026-05-16 21:11:02.516356',_binary ''),(31,70,'2026-05-16 21:11:02.571959','admin','2026-05-16 21:11:02.571970','admin',7,14,'2026-05-16 21:11:02.566653',_binary ''),(32,20,'2026-05-16 21:11:02.581119','admin','2026-05-16 21:11:02.581131','admin',12,14,'2026-05-16 21:11:02.566653',_binary ''),(33,80,'2026-05-16 21:11:02.588070','admin','2026-05-16 21:11:02.588080','admin',9,14,'2026-05-16 21:11:02.566653',_binary ''),(34,58,'2026-05-16 21:11:02.596286','admin','2026-05-16 21:11:02.596297','admin',10,14,'2026-05-16 21:11:02.566653',_binary ''),(35,20,'2026-05-16 21:11:02.612195','admin','2026-05-16 21:11:02.612206','admin',11,14,'2026-05-16 21:11:02.566653',_binary ''),(36,20,'2026-05-16 21:11:02.622344','admin','2026-05-16 21:11:02.622355','admin',8,14,'2026-05-16 21:11:02.566653',_binary ''),(37,50,'2026-05-16 21:11:02.650165','admin','2026-05-16 21:11:02.650178','admin',7,16,'2026-05-16 21:11:02.641938',_binary ''),(38,20,'2026-05-16 21:11:02.665420','admin','2026-05-16 21:11:02.665431','admin',12,16,'2026-05-16 21:11:02.641938',_binary ''),(39,50,'2026-05-16 21:11:02.679302','admin','2026-05-16 21:11:02.679315','admin',9,16,'2026-05-16 21:11:02.641938',_binary ''),(40,20,'2026-05-16 21:11:02.688297','admin','2026-05-16 21:11:02.688309','admin',10,16,'2026-05-16 21:11:02.641938',_binary ''),(41,20,'2026-05-16 21:11:02.697658','admin','2026-05-16 21:11:02.697670','admin',11,16,'2026-05-16 21:11:02.641938',_binary ''),(42,20,'2026-05-16 21:11:02.709670','admin','2026-05-16 21:11:02.709681','admin',8,16,'2026-05-16 21:11:02.641938',_binary ''),(43,90,'2026-05-16 21:11:02.730808','admin','2026-05-16 21:11:02.730891','admin',7,17,'2026-05-16 21:11:02.722105',_binary ''),(44,20,'2026-05-16 21:11:02.744591','admin','2026-05-16 21:11:02.744603','admin',12,17,'2026-05-16 21:11:02.722105',_binary ''),(45,80,'2026-05-16 21:11:02.756999','admin','2026-05-16 21:11:02.757010','admin',9,17,'2026-05-16 21:11:02.722105',_binary ''),(46,91,'2026-05-16 21:11:02.764707','admin','2026-05-16 21:11:02.764717','admin',10,17,'2026-05-16 21:11:02.722105',_binary ''),(47,20,'2026-05-16 21:11:02.774643','admin','2026-05-16 21:11:02.774654','admin',11,17,'2026-05-16 21:11:02.722105',_binary ''),(48,40,'2026-05-16 21:11:02.782053','admin','2026-05-16 21:11:02.782065','admin',8,17,'2026-05-16 21:11:02.722105',_binary ''),(49,90,'2026-05-16 21:11:02.800688','admin','2026-05-16 21:11:02.800698','admin',7,18,'2026-05-16 21:11:02.790131',_binary ''),(50,20,'2026-05-16 21:11:02.808937','admin','2026-05-16 21:11:02.808947','admin',12,18,'2026-05-16 21:11:02.790131',_binary ''),(51,80,'2026-05-16 21:11:02.819014','admin','2026-05-16 21:11:02.819024','admin',9,18,'2026-05-16 21:11:02.790131',_binary ''),(52,75,'2026-05-16 21:11:02.831516','admin','2026-05-16 21:11:02.831527','admin',10,18,'2026-05-16 21:11:02.790131',_binary ''),(53,20,'2026-05-16 21:11:02.846853','admin','2026-05-16 21:11:02.846864','admin',11,18,'2026-05-16 21:11:02.790131',_binary ''),(54,20,'2026-05-16 21:11:02.859486','admin','2026-05-16 21:11:02.859498','admin',8,18,'2026-05-16 21:11:02.790131',_binary ''),(55,90,'2026-05-16 21:11:02.874866','admin','2026-05-16 21:11:02.874876','admin',7,19,'2026-05-16 21:11:02.867474',_binary ''),(56,20,'2026-05-16 21:11:02.885093','admin','2026-05-16 21:11:02.885103','admin',12,19,'2026-05-16 21:11:02.867474',_binary ''),(57,70,'2026-05-16 21:11:02.897316','admin','2026-05-16 21:11:02.897327','admin',9,19,'2026-05-16 21:11:02.867474',_binary ''),(58,75,'2026-05-16 21:11:02.911657','admin','2026-05-16 21:11:02.911668','admin',10,19,'2026-05-16 21:11:02.867474',_binary ''),(59,20,'2026-05-16 21:11:02.921686','admin','2026-05-16 21:11:02.921696','admin',11,19,'2026-05-16 21:11:02.867474',_binary ''),(60,20,'2026-05-16 21:11:02.937007','admin','2026-05-16 21:11:02.937018','admin',8,19,'2026-05-16 21:11:02.867474',_binary ''),(61,90,'2026-05-16 21:11:02.963935','admin','2026-05-16 21:11:02.964246','admin',7,20,'2026-05-16 21:11:02.954043',_binary ''),(62,20,'2026-05-16 21:11:02.974557','admin','2026-05-16 21:11:02.974567','admin',12,20,'2026-05-16 21:11:02.954043',_binary ''),(63,70,'2026-05-16 21:11:02.989616','admin','2026-05-16 21:11:02.989626','admin',9,20,'2026-05-16 21:11:02.954043',_binary ''),(64,75,'2026-05-16 21:11:03.003407','admin','2026-05-16 21:11:03.003417','admin',10,20,'2026-05-16 21:11:02.954043',_binary ''),(65,20,'2026-05-16 21:11:03.012439','admin','2026-05-16 21:11:03.012449','admin',11,20,'2026-05-16 21:11:02.954043',_binary ''),(66,20,'2026-05-16 21:11:03.020866','admin','2026-05-16 21:11:03.020876','admin',8,20,'2026-05-16 21:11:02.954043',_binary ''),(67,70,'2026-05-16 21:11:03.055843','admin','2026-05-16 21:11:03.055853','admin',7,22,'2026-05-16 21:11:03.045858',_binary ''),(68,20,'2026-05-16 21:11:03.067276','admin','2026-05-16 21:11:03.067355','admin',12,22,'2026-05-16 21:11:03.045858',_binary ''),(69,80,'2026-05-16 21:11:03.075486','admin','2026-05-16 21:11:03.075499','admin',9,22,'2026-05-16 21:11:03.045858',_binary ''),(70,50,'2026-05-16 21:11:03.087381','admin','2026-05-16 21:11:03.087392','admin',10,22,'2026-05-16 21:11:03.045858',_binary ''),(71,20,'2026-05-16 21:11:03.098283','admin','2026-05-16 21:11:03.098296','admin',11,22,'2026-05-16 21:11:03.045858',_binary ''),(72,20,'2026-05-16 21:11:03.109340','admin','2026-05-16 21:11:03.109350','admin',8,22,'2026-05-16 21:11:03.045858',_binary ''),(73,70,'2026-05-16 21:11:03.131788','admin','2026-05-16 21:11:03.131799','admin',7,23,'2026-05-16 21:11:03.121443',_binary ''),(74,20,'2026-05-16 21:11:03.140226','admin','2026-05-16 21:11:03.140237','admin',12,23,'2026-05-16 21:11:03.121443',_binary ''),(75,70,'2026-05-16 21:11:03.151086','admin','2026-05-16 21:11:03.151096','admin',9,23,'2026-05-16 21:11:03.121443',_binary ''),(76,66,'2026-05-16 21:11:03.165950','admin','2026-05-16 21:11:03.165962','admin',10,23,'2026-05-16 21:11:03.121443',_binary ''),(77,20,'2026-05-16 21:11:03.178358','admin','2026-05-16 21:11:03.178368','admin',11,23,'2026-05-16 21:11:03.121443',_binary ''),(78,40,'2026-05-16 21:11:03.186187','admin','2026-05-16 21:11:03.186197','admin',8,23,'2026-05-16 21:11:03.121443',_binary ''),(79,90,'2026-05-16 21:11:03.199475','admin','2026-05-16 21:11:03.199486','admin',7,24,'2026-05-16 21:11:03.193027',_binary ''),(80,20,'2026-05-16 21:11:03.214201','admin','2026-05-16 21:11:03.214212','admin',12,24,'2026-05-16 21:11:03.193027',_binary ''),(81,80,'2026-05-16 21:11:03.222326','admin','2026-05-16 21:11:03.222336','admin',9,24,'2026-05-16 21:11:03.193027',_binary ''),(82,91,'2026-05-16 21:11:03.229096','admin','2026-05-16 21:11:03.229106','admin',10,24,'2026-05-16 21:11:03.193027',_binary ''),(83,20,'2026-05-16 21:11:03.235031','admin','2026-05-16 21:11:03.235041','admin',11,24,'2026-05-16 21:11:03.193027',_binary ''),(84,40,'2026-05-16 21:11:03.240109','admin','2026-05-16 21:11:03.240119','admin',8,24,'2026-05-16 21:11:03.193027',_binary ''),(85,50,'2026-05-16 21:11:03.254478','admin','2026-05-16 21:11:03.254488','admin',7,25,'2026-05-16 21:11:03.247983',_binary ''),(86,20,'2026-05-16 21:11:03.261584','admin','2026-05-16 21:11:03.261594','admin',12,25,'2026-05-16 21:11:03.247983',_binary ''),(87,50,'2026-05-16 21:11:03.266884','admin','2026-05-16 21:11:03.266894','admin',9,25,'2026-05-16 21:11:03.247983',_binary ''),(88,20,'2026-05-16 21:11:03.272303','admin','2026-05-16 21:11:03.272313','admin',10,25,'2026-05-16 21:11:03.247983',_binary ''),(89,20,'2026-05-16 21:11:03.279143','admin','2026-05-16 21:11:03.279153','admin',11,25,'2026-05-16 21:11:03.247983',_binary ''),(90,20,'2026-05-16 21:11:03.291135','admin','2026-05-16 21:11:03.291145','admin',8,25,'2026-05-16 21:11:03.247983',_binary ''),(91,75,'2026-05-16 21:11:03.321398','admin','2026-05-16 21:11:03.321413','admin',7,27,'2026-05-16 21:11:03.303575',_binary ''),(92,20,'2026-05-16 21:11:03.331763','admin','2026-05-16 21:11:03.331773','admin',12,27,'2026-05-16 21:11:03.303575',_binary ''),(93,70,'2026-05-16 21:11:03.340123','admin','2026-05-16 21:11:03.340133','admin',9,27,'2026-05-16 21:11:03.303575',_binary ''),(94,66,'2026-05-16 21:11:03.350916','admin','2026-05-16 21:11:03.350933','admin',10,27,'2026-05-16 21:11:03.303575',_binary ''),(95,20,'2026-05-16 21:11:03.356634','admin','2026-05-16 21:11:03.356645','admin',11,27,'2026-05-16 21:11:03.303575',_binary ''),(96,30,'2026-05-16 21:11:03.363074','admin','2026-05-16 21:11:03.363102','admin',8,27,'2026-05-16 21:11:03.303575',_binary ''),(97,50,'2026-05-16 21:11:03.376093','admin','2026-05-16 21:11:03.376101','admin',7,28,'2026-05-16 21:11:03.370725',_binary ''),(98,20,'2026-05-16 21:11:03.382380','admin','2026-05-16 21:11:03.382400','admin',12,28,'2026-05-16 21:11:03.370725',_binary ''),(99,50,'2026-05-16 21:11:03.396421','admin','2026-05-16 21:11:03.396430','admin',9,28,'2026-05-16 21:11:03.370725',_binary ''),(100,25,'2026-05-16 21:11:03.403802','admin','2026-05-16 21:11:03.404100','admin',10,28,'2026-05-16 21:11:03.370725',_binary ''),(101,20,'2026-05-16 21:11:03.412140','admin','2026-05-16 21:11:03.412155','admin',11,28,'2026-05-16 21:11:03.370725',_binary ''),(102,20,'2026-05-16 21:11:03.417681','admin','2026-05-16 21:11:03.417687','admin',8,28,'2026-05-16 21:11:03.370725',_binary ''),(103,70,'2026-05-16 21:11:13.499292','admin','2026-05-16 21:11:13.499310','admin',7,3,'2026-05-16 21:11:13.492530',_binary ''),(104,20,'2026-05-16 21:11:13.508844','admin','2026-05-16 21:11:13.508861','admin',12,3,'2026-05-16 21:11:13.492530',_binary ''),(105,70,'2026-05-16 21:11:13.517104','admin','2026-05-16 21:11:13.517121','admin',9,3,'2026-05-16 21:11:13.492530',_binary ''),(106,66,'2026-05-16 21:11:13.525253','admin','2026-05-16 21:11:13.525299','admin',10,3,'2026-05-16 21:11:13.492530',_binary ''),(107,20,'2026-05-16 21:11:13.544886','admin','2026-05-16 21:11:13.544906','admin',11,3,'2026-05-16 21:11:13.492530',_binary ''),(108,40,'2026-05-16 21:11:13.554230','admin','2026-05-16 21:11:13.554251','admin',8,3,'2026-05-16 21:11:13.492530',_binary ''),(109,75,'2026-05-16 21:11:33.308787','admin','2026-05-16 21:11:33.308806','admin',7,2,'2026-05-16 21:11:33.301404',_binary ''),(110,20,'2026-05-16 21:11:33.320415','admin','2026-05-16 21:11:33.320432','admin',12,2,'2026-05-16 21:11:33.301404',_binary ''),(111,80,'2026-05-16 21:11:33.329687','admin','2026-05-16 21:11:33.329705','admin',9,2,'2026-05-16 21:11:33.301404',_binary ''),(112,83,'2026-05-16 21:11:33.338735','admin','2026-05-16 21:11:33.338751','admin',10,2,'2026-05-16 21:11:33.301404',_binary ''),(113,50,'2026-05-16 21:11:33.347151','admin','2026-05-16 21:11:33.347166','admin',11,2,'2026-05-16 21:11:33.301404',_binary ''),(114,84,'2026-05-16 21:11:33.355432','admin','2026-05-16 21:11:33.355448','admin',8,2,'2026-05-16 21:11:33.301404',_binary ''),(115,50,'2026-05-17 12:26:46.550850','SYSTEM_REGISTRATION','2026-05-17 12:26:46.550861','SYSTEM_REGISTRATION',7,29,'2026-05-17 12:26:46.545773',_binary ''),(116,20,'2026-05-17 12:26:46.560001','SYSTEM_REGISTRATION','2026-05-17 12:26:46.560012','SYSTEM_REGISTRATION',12,29,'2026-05-17 12:26:46.545773',_binary ''),(117,50,'2026-05-17 12:26:46.564216','SYSTEM_REGISTRATION','2026-05-17 12:26:46.564226','SYSTEM_REGISTRATION',9,29,'2026-05-17 12:26:46.545773',_binary ''),(118,20,'2026-05-17 12:26:46.569477','SYSTEM_REGISTRATION','2026-05-17 12:26:46.569487','SYSTEM_REGISTRATION',10,29,'2026-05-17 12:26:46.545773',_binary ''),(119,20,'2026-05-17 12:26:46.575652','SYSTEM_REGISTRATION','2026-05-17 12:26:46.575662','SYSTEM_REGISTRATION',11,29,'2026-05-17 12:26:46.545773',_binary ''),(120,20,'2026-05-17 12:26:46.579740','SYSTEM_REGISTRATION','2026-05-17 12:26:46.579749','SYSTEM_REGISTRATION',8,29,'2026-05-17 12:26:46.545773',_binary ''),(121,50,'2026-05-17 14:12:50.423470','SYSTEM_REGISTRATION','2026-05-17 14:12:50.423475','SYSTEM_REGISTRATION',7,30,'2026-05-17 14:12:50.420976',_binary ''),(122,20,'2026-05-17 14:12:50.435828','SYSTEM_REGISTRATION','2026-05-17 14:12:50.435834','SYSTEM_REGISTRATION',12,30,'2026-05-17 14:12:50.420976',_binary ''),(123,50,'2026-05-17 14:12:50.439466','SYSTEM_REGISTRATION','2026-05-17 14:12:50.439470','SYSTEM_REGISTRATION',9,30,'2026-05-17 14:12:50.420976',_binary ''),(124,20,'2026-05-17 14:12:50.442851','SYSTEM_REGISTRATION','2026-05-17 14:12:50.442856','SYSTEM_REGISTRATION',10,30,'2026-05-17 14:12:50.420976',_binary ''),(125,20,'2026-05-17 14:12:50.446346','SYSTEM_REGISTRATION','2026-05-17 14:12:50.446350','SYSTEM_REGISTRATION',11,30,'2026-05-17 14:12:50.420976',_binary ''),(126,20,'2026-05-17 14:12:50.449712','SYSTEM_REGISTRATION','2026-05-17 14:12:50.449717','SYSTEM_REGISTRATION',8,30,'2026-05-17 14:12:50.420976',_binary ''),(127,50,'2026-05-17 19:52:12.476984','SYSTEM_REGISTRATION','2026-05-17 19:52:12.476996','SYSTEM_REGISTRATION',7,31,'2026-05-17 19:52:12.469419',_binary ''),(128,20,'2026-05-17 19:52:12.486596','SYSTEM_REGISTRATION','2026-05-17 19:52:12.486607','SYSTEM_REGISTRATION',12,31,'2026-05-17 19:52:12.469419',_binary ''),(129,50,'2026-05-17 19:52:12.497063','SYSTEM_REGISTRATION','2026-05-17 19:52:12.497085','SYSTEM_REGISTRATION',9,31,'2026-05-17 19:52:12.469419',_binary ''),(130,20,'2026-05-17 19:52:12.516513','SYSTEM_REGISTRATION','2026-05-17 19:52:12.516527','SYSTEM_REGISTRATION',10,31,'2026-05-17 19:52:12.469419',_binary ''),(131,20,'2026-05-17 19:52:12.527238','SYSTEM_REGISTRATION','2026-05-17 19:52:12.527260','SYSTEM_REGISTRATION',11,31,'2026-05-17 19:52:12.469419',_binary ''),(132,20,'2026-05-17 19:52:12.538020','SYSTEM_REGISTRATION','2026-05-17 19:52:12.538035','SYSTEM_REGISTRATION',8,31,'2026-05-17 19:52:12.469419',_binary ''),(133,50,'2026-05-17 22:05:22.167645','SYSTEM_REGISTRATION','2026-05-17 22:05:22.167656','SYSTEM_REGISTRATION',7,32,'2026-05-17 22:05:22.162230',_binary ''),(134,20,'2026-05-17 22:05:22.174442','SYSTEM_REGISTRATION','2026-05-17 22:05:22.174452','SYSTEM_REGISTRATION',12,32,'2026-05-17 22:05:22.162230',_binary ''),(135,50,'2026-05-17 22:05:22.181092','SYSTEM_REGISTRATION','2026-05-17 22:05:22.181103','SYSTEM_REGISTRATION',9,32,'2026-05-17 22:05:22.162230',_binary ''),(136,20,'2026-05-17 22:05:22.187123','SYSTEM_REGISTRATION','2026-05-17 22:05:22.187135','SYSTEM_REGISTRATION',10,32,'2026-05-17 22:05:22.162230',_binary ''),(137,20,'2026-05-17 22:05:22.192385','SYSTEM_REGISTRATION','2026-05-17 22:05:22.192396','SYSTEM_REGISTRATION',11,32,'2026-05-17 22:05:22.162230',_binary ''),(138,20,'2026-05-17 22:05:22.197410','SYSTEM_REGISTRATION','2026-05-17 22:05:22.197422','SYSTEM_REGISTRATION',8,32,'2026-05-17 22:05:22.162230',_binary ''),(139,50,'2026-05-17 22:08:49.829189','SYSTEM_REGISTRATION','2026-05-17 22:08:49.829205','SYSTEM_REGISTRATION',7,33,'2026-05-17 22:08:49.824425',_binary ''),(140,20,'2026-05-17 22:08:49.835722','SYSTEM_REGISTRATION','2026-05-17 22:08:49.835737','SYSTEM_REGISTRATION',12,33,'2026-05-17 22:08:49.824425',_binary ''),(141,50,'2026-05-17 22:08:49.842169','SYSTEM_REGISTRATION','2026-05-17 22:08:49.842185','SYSTEM_REGISTRATION',9,33,'2026-05-17 22:08:49.824425',_binary ''),(142,20,'2026-05-17 22:08:49.852073','SYSTEM_REGISTRATION','2026-05-17 22:08:49.852090','SYSTEM_REGISTRATION',10,33,'2026-05-17 22:08:49.824425',_binary ''),(143,20,'2026-05-17 22:08:49.861704','SYSTEM_REGISTRATION','2026-05-17 22:08:49.861721','SYSTEM_REGISTRATION',11,33,'2026-05-17 22:08:49.824425',_binary ''),(144,20,'2026-05-17 22:08:49.871716','SYSTEM_REGISTRATION','2026-05-17 22:08:49.871733','SYSTEM_REGISTRATION',8,33,'2026-05-17 22:08:49.824425',_binary ''),(145,50,'2026-05-17 22:41:42.183799','SYSTEM_REGISTRATION','2026-05-17 22:41:42.183811','SYSTEM_REGISTRATION',7,34,'2026-05-17 22:41:42.172403',_binary ''),(146,20,'2026-05-17 22:41:42.196142','SYSTEM_REGISTRATION','2026-05-17 22:41:42.196153','SYSTEM_REGISTRATION',12,34,'2026-05-17 22:41:42.172403',_binary ''),(147,50,'2026-05-17 22:41:42.203906','SYSTEM_REGISTRATION','2026-05-17 22:41:42.203916','SYSTEM_REGISTRATION',9,34,'2026-05-17 22:41:42.172403',_binary ''),(148,20,'2026-05-17 22:41:42.208702','SYSTEM_REGISTRATION','2026-05-17 22:41:42.208713','SYSTEM_REGISTRATION',10,34,'2026-05-17 22:41:42.172403',_binary ''),(149,20,'2026-05-17 22:41:42.215491','SYSTEM_REGISTRATION','2026-05-17 22:41:42.215501','SYSTEM_REGISTRATION',11,34,'2026-05-17 22:41:42.172403',_binary ''),(150,20,'2026-05-17 22:41:42.221268','SYSTEM_REGISTRATION','2026-05-17 22:41:42.221280','SYSTEM_REGISTRATION',8,34,'2026-05-17 22:41:42.172403',_binary ''),(151,50,'2026-05-18 15:41:07.214626','SYSTEM_REGISTRATION','2026-05-18 15:41:07.214653','SYSTEM_REGISTRATION',7,36,'2026-05-18 15:41:07.208515',_binary ''),(152,20,'2026-05-18 15:41:07.239332','SYSTEM_REGISTRATION','2026-05-18 15:41:07.239357','SYSTEM_REGISTRATION',12,36,'2026-05-18 15:41:07.208515',_binary ''),(153,50,'2026-05-18 15:41:07.252462','SYSTEM_REGISTRATION','2026-05-18 15:41:07.252481','SYSTEM_REGISTRATION',9,36,'2026-05-18 15:41:07.208515',_binary ''),(154,20,'2026-05-18 15:41:07.261845','SYSTEM_REGISTRATION','2026-05-18 15:41:07.261861','SYSTEM_REGISTRATION',10,36,'2026-05-18 15:41:07.208515',_binary ''),(155,20,'2026-05-18 15:41:07.278923','SYSTEM_REGISTRATION','2026-05-18 15:41:07.278942','SYSTEM_REGISTRATION',11,36,'2026-05-18 15:41:07.208515',_binary ''),(156,20,'2026-05-18 15:41:07.286954','SYSTEM_REGISTRATION','2026-05-18 15:41:07.286972','SYSTEM_REGISTRATION',8,36,'2026-05-18 15:41:07.208515',_binary ''),(157,50,'2026-05-18 16:23:26.635776','SYSTEM_REGISTRATION','2026-05-18 16:23:26.635783','SYSTEM_REGISTRATION',7,37,'2026-05-18 16:23:26.633486',_binary ''),(158,20,'2026-05-18 16:23:26.642555','SYSTEM_REGISTRATION','2026-05-18 16:23:26.642562','SYSTEM_REGISTRATION',12,37,'2026-05-18 16:23:26.633486',_binary ''),(159,50,'2026-05-18 16:23:26.646480','SYSTEM_REGISTRATION','2026-05-18 16:23:26.646486','SYSTEM_REGISTRATION',9,37,'2026-05-18 16:23:26.633486',_binary ''),(160,20,'2026-05-18 16:23:26.650180','SYSTEM_REGISTRATION','2026-05-18 16:23:26.650187','SYSTEM_REGISTRATION',10,37,'2026-05-18 16:23:26.633486',_binary ''),(161,20,'2026-05-18 16:23:26.655465','SYSTEM_REGISTRATION','2026-05-18 16:23:26.655471','SYSTEM_REGISTRATION',11,37,'2026-05-18 16:23:26.633486',_binary ''),(162,20,'2026-05-18 16:23:26.659059','SYSTEM_REGISTRATION','2026-05-18 16:23:26.659064','SYSTEM_REGISTRATION',8,37,'2026-05-18 16:23:26.633486',_binary ''),(163,50,'2026-05-22 11:43:52.249095','SYSTEM_REGISTRATION','2026-05-22 11:43:52.249099','SYSTEM_REGISTRATION',7,38,'2026-05-22 11:43:52.246291',_binary ''),(164,20,'2026-05-22 11:43:52.257249','SYSTEM_REGISTRATION','2026-05-22 11:43:52.257252','SYSTEM_REGISTRATION',12,38,'2026-05-22 11:43:52.246291',_binary ''),(165,50,'2026-05-22 11:43:52.269705','SYSTEM_REGISTRATION','2026-05-22 11:43:52.269714','SYSTEM_REGISTRATION',9,38,'2026-05-22 11:43:52.246291',_binary ''),(166,20,'2026-05-22 11:43:52.284913','SYSTEM_REGISTRATION','2026-05-22 11:43:52.284919','SYSTEM_REGISTRATION',10,38,'2026-05-22 11:43:52.246291',_binary ''),(167,20,'2026-05-22 11:43:52.294515','SYSTEM_REGISTRATION','2026-05-22 11:43:52.294521','SYSTEM_REGISTRATION',11,38,'2026-05-22 11:43:52.246291',_binary ''),(168,20,'2026-05-22 11:43:52.301602','SYSTEM_REGISTRATION','2026-05-22 11:43:52.301609','SYSTEM_REGISTRATION',8,38,'2026-05-22 11:43:52.246291',_binary ''),(169,50,'2026-05-22 12:44:40.397939','SYSTEM_REGISTRATION','2026-05-22 12:44:40.397944','SYSTEM_REGISTRATION',7,40,'2026-05-22 12:44:40.395448',_binary ''),(170,20,'2026-05-22 12:44:40.402218','SYSTEM_REGISTRATION','2026-05-22 12:44:40.402223','SYSTEM_REGISTRATION',12,40,'2026-05-22 12:44:40.395448',_binary ''),(171,50,'2026-05-22 12:44:40.405950','SYSTEM_REGISTRATION','2026-05-22 12:44:40.405955','SYSTEM_REGISTRATION',9,40,'2026-05-22 12:44:40.395448',_binary ''),(172,20,'2026-05-22 12:44:40.409433','SYSTEM_REGISTRATION','2026-05-22 12:44:40.409439','SYSTEM_REGISTRATION',10,40,'2026-05-22 12:44:40.395448',_binary ''),(173,20,'2026-05-22 12:44:40.421963','SYSTEM_REGISTRATION','2026-05-22 12:44:40.421971','SYSTEM_REGISTRATION',11,40,'2026-05-22 12:44:40.395448',_binary ''),(174,20,'2026-05-22 12:44:40.427888','SYSTEM_REGISTRATION','2026-05-22 12:44:40.427894','SYSTEM_REGISTRATION',8,40,'2026-05-22 12:44:40.395448',_binary ''),(175,50,'2026-05-26 16:45:55.349502','SYSTEM_REGISTRATION','2026-05-26 16:45:55.349506','SYSTEM_REGISTRATION',7,41,'2026-05-26 16:45:55.345742',_binary ''),(176,20,'2026-05-26 16:45:55.359397','SYSTEM_REGISTRATION','2026-05-26 16:45:55.359404','SYSTEM_REGISTRATION',12,41,'2026-05-26 16:45:55.345742',_binary ''),(177,50,'2026-05-26 16:45:55.366960','SYSTEM_REGISTRATION','2026-05-26 16:45:55.366971','SYSTEM_REGISTRATION',9,41,'2026-05-26 16:45:55.345742',_binary ''),(178,20,'2026-05-26 16:45:55.375483','SYSTEM_REGISTRATION','2026-05-26 16:45:55.375491','SYSTEM_REGISTRATION',10,41,'2026-05-26 16:45:55.345742',_binary ''),(179,20,'2026-05-26 16:45:55.387706','SYSTEM_REGISTRATION','2026-05-26 16:45:55.387713','SYSTEM_REGISTRATION',11,41,'2026-05-26 16:45:55.345742',_binary ''),(180,20,'2026-05-26 16:45:55.394276','SYSTEM_REGISTRATION','2026-05-26 16:45:55.394283','SYSTEM_REGISTRATION',8,41,'2026-05-26 16:45:55.345742',_binary ''),(181,50,'2026-05-28 12:41:02.140715','SYSTEM_REGISTRATION','2026-05-28 12:41:02.140718','SYSTEM_REGISTRATION',7,42,'2026-05-28 12:41:02.138012',_binary ''),(182,20,'2026-05-28 12:41:02.149387','SYSTEM_REGISTRATION','2026-05-28 12:41:02.149408','SYSTEM_REGISTRATION',12,42,'2026-05-28 12:41:02.138012',_binary ''),(183,50,'2026-05-28 12:41:02.152823','SYSTEM_REGISTRATION','2026-05-28 12:41:02.152825','SYSTEM_REGISTRATION',9,42,'2026-05-28 12:41:02.138012',_binary ''),(184,20,'2026-05-28 12:41:02.155641','SYSTEM_REGISTRATION','2026-05-28 12:41:02.155643','SYSTEM_REGISTRATION',10,42,'2026-05-28 12:41:02.138012',_binary ''),(185,20,'2026-05-28 12:41:02.158289','SYSTEM_REGISTRATION','2026-05-28 12:41:02.158302','SYSTEM_REGISTRATION',11,42,'2026-05-28 12:41:02.138012',_binary ''),(186,20,'2026-05-28 12:41:02.160815','SYSTEM_REGISTRATION','2026-05-28 12:41:02.160818','SYSTEM_REGISTRATION',8,42,'2026-05-28 12:41:02.138012',_binary ''),(187,50,'2026-06-01 12:13:13.074031','SYSTEM_REGISTRATION','2026-06-01 12:13:13.074040','SYSTEM_REGISTRATION',7,43,'2026-06-01 12:13:13.068686',_binary ''),(188,20,'2026-06-01 12:13:13.085014','SYSTEM_REGISTRATION','2026-06-01 12:13:13.085022','SYSTEM_REGISTRATION',12,43,'2026-06-01 12:13:13.068686',_binary ''),(189,50,'2026-06-01 12:13:13.091112','SYSTEM_REGISTRATION','2026-06-01 12:13:13.091121','SYSTEM_REGISTRATION',9,43,'2026-06-01 12:13:13.068686',_binary ''),(190,20,'2026-06-01 12:13:13.097158','SYSTEM_REGISTRATION','2026-06-01 12:13:13.097166','SYSTEM_REGISTRATION',10,43,'2026-06-01 12:13:13.068686',_binary ''),(191,20,'2026-06-01 12:13:13.104385','SYSTEM_REGISTRATION','2026-06-01 12:13:13.104394','SYSTEM_REGISTRATION',11,43,'2026-06-01 12:13:13.068686',_binary ''),(192,20,'2026-06-01 12:13:13.112052','SYSTEM_REGISTRATION','2026-06-01 12:13:13.112061','SYSTEM_REGISTRATION',8,43,'2026-06-01 12:13:13.068686',_binary '');
/*!40000 ALTER TABLE `player_attributes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_highlights`
--

DROP TABLE IF EXISTS `player_highlights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_highlights` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `highlight_date` date DEFAULT NULL,
  `platform` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `player_id` bigint NOT NULL,
  `approval_status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKkp9m8h83tpa7e78wkk8o3o6em` (`player_id`),
  CONSTRAINT `FKkp9m8h83tpa7e78wkk8o3o6em` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_highlights`
--

LOCK TABLES `player_highlights` WRITE;
/*!40000 ALTER TABLE `player_highlights` DISABLE KEYS */;
INSERT INTO `player_highlights` VALUES (2,'2026-05-12 12:45:27.823744','2026-05-11','youtube',NULL,'2026-05-12 12:45:27.823744','https://www.youtube.com/watch?v=mmeLCAP74KA',17,'PENDING'),(5,'2026-05-16 21:20:19.613588','2026-05-20','youtube',NULL,'2026-05-16 21:20:19.613588','https://www.youtube.com/watch?v=8cY7Yuyz3TU',24,'PENDING'),(22,'2026-05-17 14:04:21.187894','2026-04-29','youtube',NULL,'2026-05-17 14:04:21.187894','https://www.youtube.com/watch?v=HA7hWH2GLjI&t=111s',29,'PENDING'),(23,'2026-05-17 14:04:21.189842','2026-05-18','facebook',NULL,'2026-05-17 14:04:21.189842','https://www.facebook.com/share/r/1G1Nk4Z2Y3/',29,'PENDING'),(31,'2026-05-18 16:30:27.717228','2026-05-17','youtube',NULL,'2026-05-18 16:30:27.717228','https://www.youtube.com/watch?v=6a1VJpiYJxI',37,'APPROVED');
/*!40000 ALTER TABLE `player_highlights` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_socials`
--

DROP TABLE IF EXISTS `player_socials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_socials` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `platform` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `player_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_chsn19vou9t76me8a07o702rb` (`url`),
  KEY `FK8rawxrxwo5lo7ir3jn7b4mm4v` (`player_id`),
  CONSTRAINT `FK8rawxrxwo5lo7ir3jn7b4mm4v` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_socials`
--

LOCK TABLES `player_socials` WRITE;
/*!40000 ALTER TABLE `player_socials` DISABLE KEYS */;
INSERT INTO `player_socials` VALUES (5,'2026-05-12 12:45:27.831454','facebook','2026-05-12 12:45:27.831454','https://www.facebook.com/vu.minh.tuan.750929/',17),(12,'2026-05-16 21:20:19.620784','facebook','2026-05-16 21:20:19.620784','https://www.facebook.com/vu.minh.tuan.750929',24),(24,'2026-05-17 14:04:21.195214','facebook','2026-05-17 14:04:21.195214','https://www.facebook.com/profile.php?id=100063469383681',29),(29,'2026-05-17 20:21:41.695743','facebook','2026-05-17 20:21:41.695743','https://www.facebook.com/iamcot',2),(34,'2026-05-18 16:21:59.788915','instagram','2026-05-18 16:21:59.788915','https://www.instagram.com/lethbinh _10?igsh=cXdqcjg4N2gyeGtp&utm_source=qr,',32),(35,'2026-05-18 16:21:59.792775','facebook','2026-05-18 16:21:59.792775','https://www.facebook.com/share/1BWD7ZRyhU/?mibextid=wwXIfr',32),(43,'2026-05-18 16:30:27.730773','facebook','2026-05-18 16:30:27.730773','https://www.facebook.com/profile.php?id=100072274716909',37);
/*!40000 ALTER TABLE `player_socials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `players` (
  `id` bigint NOT NULL,
  `academy_id` bigint DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL,
  `height` int DEFAULT NULL,
  `level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `positions` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_foot` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `weight` int DEFAULT NULL,
  `academy` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `club` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `personal_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secondary_position` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified` bit(1) NOT NULL,
  `years_of_experience` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FKew10bdm70xnwdi3dgm7ja23fk` FOREIGN KEY (`id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `players`
--

LOCK TABLES `players` WRITE;
/*!40000 ALTER TABLE `players` DISABLE KEYS */;
INSERT INTO `players` VALUES (2,NULL,'hehe','2026-04-20 07:37:05.928204',160,'CHUYEN_NGHIEP','striker','both','2026-05-17 21:31:23.719125',61,'PVF','','Manchester United','','','',_binary '',5),(3,NULL,NULL,'2026-04-21 02:46:57.963482',180,'NGHIEP_DU','striker','left','2026-04-21 02:48:18.206860',75,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(7,NULL,NULL,'2026-04-27 04:24:00.653210',190,NULL,'defender','right','2026-04-27 04:24:00.653242',85,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(10,NULL,NULL,'2026-04-29 04:28:57.739273',NULL,NULL,'striker','left','2026-04-29 04:28:57.739278',NULL,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(12,NULL,NULL,'2026-05-08 20:33:48.734591',NULL,NULL,'centerback','right','2026-05-08 20:33:48.734601',NULL,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(14,NULL,NULL,'2026-05-10 06:44:37.599319',168,NULL,'midfielder','both','2026-05-10 06:45:47.216779',70,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(16,NULL,NULL,'2026-05-10 14:45:27.856965',NULL,NULL,'',NULL,'2026-05-10 14:45:27.856989',NULL,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(17,NULL,'a','2026-05-12 12:37:19.898678',170,'NGHIEP_DU','defender,midfielder','right','2026-05-12 12:45:27.795235',65,'không có',NULL,'Swinburne Football Club','016205020666','Swinburne University of Technology',NULL,_binary '\0',NULL),(18,NULL,NULL,'2026-05-12 12:52:38.416780',180,NULL,'striker','both','2026-05-12 12:52:38.416800',70,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(19,NULL,NULL,'2026-05-12 13:02:50.551284',175,NULL,'striker','left','2026-05-12 13:02:50.551298',66,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(20,NULL,NULL,'2026-05-12 13:17:16.245131',180,NULL,'defender','left','2026-05-12 13:17:16.245152',69,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(22,NULL,'','2026-05-12 22:21:15.139556',180,'CAU_THU_MOI','midfielder','left','2026-05-30 17:35:04.052272',80,'','','','','','',_binary '\0',5),(23,NULL,'hello','2026-05-12 22:53:14.405633',190,'NGHIEP_DU','striker','right','2026-05-16 18:44:44.322819',80,'hagl',NULL,'tp hcm','123','ng',NULL,_binary '\0',NULL),(24,NULL,'a','2026-05-13 09:19:03.390054',180,'NGHIEP_DU','','right','2026-05-16 21:20:19.624288',70,'không có','','Thanh Hùng Futsal','089205020777','ĐH FPT','',_binary '\0',NULL),(25,NULL,NULL,'2026-05-13 10:59:51.610392',NULL,NULL,'',NULL,'2026-05-13 10:59:51.610437',NULL,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(27,NULL,NULL,'2026-05-13 16:27:07.528219',180,'CAU_THU_MOI','striker','left','2026-05-13 16:28:04.500401',61,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(28,NULL,NULL,'2026-05-13 21:39:02.307054',NULL,NULL,'',NULL,'2026-05-17 12:23:56.389433',NULL,NULL,NULL,'Swinburne Football Club',NULL,'ĐH FPT',NULL,_binary '\0',NULL),(29,NULL,NULL,'2026-05-17 12:26:46.531249',188,'TUYEN_TRE','striker','right','2026-05-17 12:35:21.381837',75,'không có',NULL,'Thanh Hùng Futsal','079205020670','Swinburne University of Technology','midfielder',_binary '\0',5),(30,NULL,NULL,'2026-05-17 14:12:50.412713',NULL,NULL,NULL,NULL,'2026-05-17 14:12:50.412718',NULL,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(31,NULL,NULL,'2026-05-17 19:52:12.434068',167,'CAU_THU_MOI','midfielder','right','2026-05-17 19:54:13.575963',60,NULL,NULL,NULL,NULL,NULL,'goalkeeper',_binary '\0',5),(32,NULL,'đã từng đá Hậu vệ,vui vẻ hoà đồng','2026-05-17 22:05:22.141981',176,'TUYEN_TRE','striker','right','2026-05-18 16:21:59.796068',61,'Tphcm','16/2A ấp Hưng Lân, xã Bà Điểm,huyện Hóc Môn','CLB U17 TpHCM','079210017495','','defender',_binary '\0',5),(33,NULL,NULL,'2026-05-17 22:08:49.815518',NULL,NULL,NULL,NULL,'2026-05-17 22:08:49.815546',NULL,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(34,NULL,NULL,'2026-05-17 22:41:42.164140',NULL,NULL,NULL,NULL,'2026-05-17 22:41:42.164404',NULL,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(36,NULL,'Con rất đam mê môn bóng đá ạ','2026-05-18 15:41:07.182377',173,'TUYEN_TRE','striker','right','2026-05-18 15:45:59.280101',55,NULL,NULL,NULL,'001211047818','Trung học cơ sở tại mai dịch ','midfielder',_binary '\0',2),(37,NULL,'a','2026-05-18 16:23:26.626460',170,'TUYEN_TRE','defender','right','2026-05-18 16:30:27.735487',65,'PVF','','CLB Trẻ PVF','079205020777','ĐH FPT','midfielder',_binary '\0',16),(38,NULL,NULL,'2026-05-22 11:43:52.235777',NULL,NULL,NULL,NULL,'2026-05-22 11:43:52.235783',NULL,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',NULL),(40,NULL,'Em từng thi tuyển PVF 2023 vào vòng 2, Becamex Bình Dương 2024 vào vòng 2. Và tập ở BMG 2026 ','2026-05-22 12:44:40.386751',184,'TUYEN_TRE','goalkeeper','right','2026-05-22 12:56:37.909988',82,'BMG',NULL,NULL,NULL,'THCS Trần Huy Liệu ','defender',_binary '\0',4),(41,NULL,NULL,'2026-05-26 16:45:55.332383',170,'CAU_THU_MOI','striker','both','2026-05-26 16:46:46.125734',62,NULL,NULL,NULL,NULL,NULL,NULL,_binary '\0',0),(42,NULL,NULL,'2026-05-28 12:41:02.127914',160,'TUYEN_TRE','defender','left','2026-05-28 12:43:57.468922',57,NULL,NULL,NULL,NULL,NULL,'midfielder',_binary '\0',10),(43,NULL,'','2026-06-01 12:13:13.031117',170,'NGHIEP_DU','defender','right','2026-06-01 12:20:09.438288',63,'','','','','','midfielder',_binary '\0',5);
/*!40000 ALTER TABLE `players` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provinces`
--

DROP TABLE IF EXISTS `provinces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provinces` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_l256wnwfdobq071mcq7rckr9y` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provinces`
--

LOCK TABLES `provinces` WRITE;
/*!40000 ALTER TABLE `provinces` DISABLE KEYS */;
INSERT INTO `provinces` VALUES (1,'2026-04-20 07:36:16.000000','Thành phố Hà Nội','2026-04-20 07:36:16.000000'),(2,'2026-04-20 07:36:16.000000','Thành phố Hồ Chí Minh','2026-04-20 07:36:16.000000'),(3,'2026-04-20 07:36:16.000000','Thành phố Hải Phòng','2026-04-20 07:36:16.000000'),(4,'2026-04-20 07:36:16.000000','Thành phố Đà Nẵng','2026-04-20 07:36:16.000000'),(5,'2026-04-20 07:36:16.000000','Thành phố Cần Thơ','2026-04-20 07:36:16.000000'),(6,'2026-04-20 07:36:16.000000','Thành phố Huế','2026-04-20 07:36:16.000000'),(7,'2026-04-20 07:36:16.000000','Tỉnh Cao Bằng','2026-04-20 07:36:16.000000'),(8,'2026-04-20 07:36:16.000000','Tỉnh Hà Giang','2026-04-20 07:36:16.000000'),(9,'2026-04-20 07:36:16.000000','Tỉnh Lào Cai','2026-04-20 07:36:16.000000'),(10,'2026-04-20 07:36:16.000000','Tỉnh Sơn La','2026-04-20 07:36:16.000000'),(11,'2026-04-20 07:36:16.000000','Tỉnh Điện Biên','2026-04-20 07:36:16.000000'),(12,'2026-04-20 07:36:16.000000','Tỉnh Lai Châu','2026-04-20 07:36:16.000000'),(13,'2026-04-20 07:36:16.000000','Tỉnh Lạng Sơn','2026-04-20 07:36:16.000000'),(14,'2026-04-20 07:36:16.000000','Tỉnh Quảng Ninh','2026-04-20 07:36:16.000000'),(15,'2026-04-20 07:36:16.000000','Tỉnh Bắc Ninh','2026-04-20 07:36:16.000000'),(16,'2026-04-20 07:36:16.000000','Tỉnh Vĩnh Phúc','2026-04-20 07:36:16.000000'),(17,'2026-04-20 07:36:16.000000','Tỉnh Phú Thọ','2026-04-20 07:36:16.000000'),(18,'2026-04-20 07:36:16.000000','Tỉnh Thái Nguyên','2026-04-20 07:36:16.000000'),(19,'2026-04-20 07:36:16.000000','Tỉnh Nghệ An','2026-04-20 07:36:16.000000'),(20,'2026-04-20 07:36:16.000000','Tỉnh Thanh Hóa','2026-04-20 07:36:16.000000'),(21,'2026-04-20 07:36:16.000000','Tỉnh Hà Tĩnh','2026-04-20 07:36:16.000000'),(22,'2026-04-20 07:36:16.000000','Tỉnh Quảng Bình','2026-04-20 07:36:16.000000'),(23,'2026-04-20 07:36:16.000000','Tỉnh Quảng Trị','2026-04-20 07:36:16.000000'),(24,'2026-04-20 07:36:16.000000','Tỉnh Bình Định','2026-04-20 07:36:16.000000'),(25,'2026-04-20 07:36:16.000000','Tỉnh Khánh Hòa','2026-04-20 07:36:16.000000'),(26,'2026-04-20 07:36:16.000000','Tỉnh Đắk Lắk','2026-04-20 07:36:16.000000'),(27,'2026-04-20 07:36:16.000000','Tỉnh Gia Lai','2026-04-20 07:36:16.000000'),(28,'2026-04-20 07:36:16.000000','Tỉnh Kon Tum','2026-04-20 07:36:16.000000'),(29,'2026-04-20 07:36:16.000000','Tỉnh Lâm Đồng','2026-04-20 07:36:16.000000'),(30,'2026-04-20 07:36:16.000000','Tỉnh Bình Thuận','2026-04-20 07:36:16.000000'),(31,'2026-04-20 07:36:16.000000','Tỉnh Đồng Nai','2026-04-20 07:36:16.000000'),(32,'2026-04-20 07:36:16.000000','Tỉnh Tây Ninh','2026-04-20 07:36:16.000000'),(33,'2026-04-20 07:36:16.000000','Tỉnh Kiên Giang','2026-04-20 07:36:16.000000'),(34,'2026-04-20 07:36:16.000000','Tỉnh Cà Mau','2026-04-20 07:36:16.000000');
/*!40000 ALTER TABLE `provinces` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scouters`
--

DROP TABLE IF EXISTS `scouters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scouters` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `specialization` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `territory` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `years_of_experience` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FKmt025i8y2uk2y0wgai359mnop` FOREIGN KEY (`id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scouters`
--

LOCK TABLES `scouters` WRITE;
/*!40000 ALTER TABLE `scouters` DISABLE KEYS */;
/*!40000 ALTER TABLE `scouters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `account_non_expired` bit(1) NOT NULL,
  `account_non_locked` bit(1) NOT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `credentials_non_expired` bit(1) NOT NULL,
  `dob` date DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('USER','PLAYER','COACH','SCOUTER','EDITOR','ADMIN','SUPER_USER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `userid` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_du5v5sr43g5bfnji4vb8hg5s3` (`phone`),
  UNIQUE KEY `UK_jyjiwnaabof8kpd0gclhcj2lh` (`userid`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,_binary '',_binary '',NULL,'2026-04-20 06:58:25.288909',_binary '',NULL,'admin@11of.com',_binary '','Administrator',NULL,'$2a$10$.BgOR8.D4uDciWE4gEod7uOYYa4M3gM6PAAlAT0SRhnqFtBSQzZZW','admin','ADMIN','2026-04-20 06:58:25.288937','admin00000000000'),(2,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/2_1778940929472_6904f52f.jpg','2026-04-20 07:37:05.880313',_binary '','1987-08-19','',_binary '\0','Thắng Trương ','MALE','$2a$10$YuLOD0tNuwybHEzvoz.6o./qdZWOWkp1glt0vP/U.AdjzShsliboO','0395359198','PLAYER','2026-05-17 21:51:05.495479','dumdh0d0v5p1cjtm'),(3,_binary '',_binary '',NULL,'2026-04-21 02:46:57.947746',_binary '',NULL,'hoangyenngan1503@gmail.com',_binary '\0','Nguyễn Hoàng Thy','MALE','$2a$10$aDM07vW3TqSuJ5RfuqpqiOetC4gCpcXLGJ7gcljY7TlSVva1dS9Eu','0339520318','PLAYER','2026-05-17 14:14:00.882609','7o1qka9etzsf61pr'),(4,_binary '',_binary '',NULL,'2026-04-21 14:50:49.983242',_binary '',NULL,NULL,_binary '','Phạm Quỳnh Giang',NULL,'$2a$10$mv19TBc0XLamcExSdunG8.gVO3xOWT2Qh7XMUA/u3JO2oWHNIAO2i','0906078300','USER','2026-04-21 14:50:49.983253','e5mdmp92sgcfle9x'),(5,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/5_1776785250391_9536cf33.jpeg','2026-04-21 15:26:03.758162',_binary '',NULL,NULL,_binary '','Trinh 11 ON FIELD',NULL,'$2a$10$BFrvLWIg1U4OGH87DEduiuQ0pzRTc2tK.Ygn.ZRjzaQZa0TWNG0Qq','0908845258','USER','2026-04-21 15:27:30.864978','v2ih83u4or1uftuq'),(6,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/6_1777187267325_78c86c02.jpeg','2026-04-26 07:03:27.105302',_binary '','2004-09-07',NULL,_binary '','Kiều Anh','FEMALE','$2a$10$.rsQH5ZMZ1FUv2Y6U3uEp.me97nWP6/Ac627afIiy5rYx8QtufluO','0946649231','USER','2026-04-26 07:07:47.586121','2gjoy4poz64mxcbe'),(7,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/7_1777263947165_882d1fb9.png','2026-04-27 04:24:00.549829',_binary '',NULL,NULL,_binary '\0','Ronaldo',NULL,'$2a$10$GUpvkz40iOt8ouc7HGSiiOF.4SnrrkOjjGUyRLpdY6liqB.gOYcgG','0983717098','PLAYER','2026-05-17 14:13:53.053080','glwmsymxv5myqm9d'),(8,_binary '',_binary '',NULL,'2026-04-27 04:36:24.128483',_binary '',NULL,NULL,_binary '','ĐINH PHẠM CÔNG SƠN',NULL,'$2a$10$FFJADm5dec03M2LTlbF3T.8oD5vaAACQl6j4RblAvBrFyKJJADULC','0376621711','USER','2026-04-27 04:36:24.128498','vzovln4zucx5nj1s'),(9,_binary '',_binary '',NULL,'2026-04-27 05:10:20.695244',_binary '',NULL,NULL,_binary '','NGUYỄN THÁI AN',NULL,'$2a$10$tARnySfpunE8BDHsNmmPAujOr0JD0xKFBhpY.sRG7/zhOdbD9d8zu','0376627111','USER','2026-04-27 05:10:20.695254','dn4ia1rq0corzc3r'),(10,_binary '',_binary '',NULL,'2026-04-29 04:28:57.726558',_binary '',NULL,'nhareviewdep@gmail.com',_binary '\0','Hoàng Phương',NULL,'$2a$10$1YlfLO9PFW2qsZr.AcWOiek6gH/0Uc6nf5H5a6dOicmQ.r7k99grK','0123456789','PLAYER','2026-05-17 14:13:45.871691','l1ur1o12bkcd5owd'),(11,_binary '',_binary '',NULL,'2026-05-08 20:30:07.557959',_binary '','1985-07-02','info.anylearn@gmail.com',_binary '','anyLEARN','FEMALE','$2a$10$XzA8keTS4t8917NiAGasrOkPdqurHaPFquIy0GT61l8IS.oHkELvy','0374900344','USER','2026-05-08 20:32:01.928853','945g6efx7iig8o8r'),(12,_binary '',_binary '',NULL,'2026-05-08 20:33:48.719255',_binary '',NULL,NULL,_binary '\0','ANDY',NULL,'$2a$10$m571z2LVNOZTaFDfQ7351OjPwniIv4e2ty6MxpIRSJtQeekgpQJLm','0170920170','PLAYER','2026-05-17 14:13:39.568246','wp2sd8yjgl7saca2'),(13,_binary '',_binary '',NULL,'2026-05-10 06:16:32.120971',_binary '',NULL,NULL,_binary '','Viet Anh',NULL,'$2a$10$lol0puwcNI.guFXOw7mavObh2whR7D03qWsriELhyzvwkXmEdKniW','0908123456','PLAYER','2026-05-10 06:16:32.121001','h81tbmjnqbc4gfvv'),(14,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/14_1778370276162_306ec7d7.jpeg','2026-05-10 06:21:50.290089',_binary '',NULL,NULL,_binary '\0','Messi','MALE','$2a$10$JK7Pmfn7r1nAFJJm.kDJleJ0uz40Vk7AoaMZWHIr7sSdXFi9AfH1S','0123456798','PLAYER','2026-05-17 14:13:33.616797','mvr13hznirr38mwt'),(15,_binary '',_binary '',NULL,'2026-05-10 09:28:33.077517',_binary '',NULL,NULL,_binary '','Thang 3',NULL,'$2a$10$O2QricH8HCjhqCyTwVqY4OjIvB9zkz6NYJGTd8vWgnE/0aYx3Iovu','0333333333','PLAYER','2026-05-10 09:28:33.077556','i1oi16jkjtbwm0la'),(16,_binary '',_binary '',NULL,'2026-05-10 14:45:13.306116',_binary '',NULL,NULL,_binary '\0','Thang 04',NULL,'$2a$10$06StcWmefqzhlAAupb93Ou3RnpTh/ySRVrTglK4By4UDAwSXCFC1u','0444444444','PLAYER','2026-05-17 14:13:27.856060','bhdulok15hzsizcs'),(17,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/17_1778564278433_17c4b876.jpg','2026-05-12 12:32:08.323555',_binary '','2007-05-07','vucole816@gmail.com',_binary '\0','VMT (test)','MALE','$2a$10$QQXgfsdhEty.4zcv3UPYxOhoLWQQKk8JNK/9DmVRPLi.PAWtz49z2','0912312312','PLAYER','2026-05-17 14:13:19.989581','651mawojz42g9h3x'),(18,_binary '',_binary '',NULL,'2026-05-12 12:50:37.023121',_binary '','2008-05-04','12@123gmail.com',_binary '\0','Cole Vu','MALE','$2a$10$8.7wpbOyhKDlpd4cxuE9ie1oDPluUY3uXQpK5jmCmUDmQa7oRgWwu','0983367099','PLAYER','2026-05-17 13:25:56.958515','roy7eub2sv33dp6v'),(19,_binary '',_binary '',NULL,'2026-05-12 12:58:54.790806',_binary '','2008-05-03','tuanvm.forwork@gmail.com',_binary '\0','Tuan Tran','MALE','$2a$10$vQ73dGoNs6p297HBmmW.LO14fuSzqTxx9Z.rsMwieEGCFhugjvPqK','0983367066','PLAYER','2026-05-17 14:08:40.951587','o60x93vur0x2npkg'),(20,_binary '',_binary '',NULL,'2026-05-12 13:14:30.318714',_binary '','2006-05-10','van123@gmail.com',_binary '\0','Nguyễn Văn A','MALE','$2a$10$gZb7y/r1afJ0jZHT44GagOsGn8xMmO.hmgBJsxp1ctwtVELs5WLDC','0123456788','PLAYER','2026-05-12 18:33:30.197026','x31007pojooxwvix'),(21,_binary '',_binary '',NULL,'2026-05-12 13:39:05.841022',_binary '',NULL,NULL,_binary '','Nguyễn Hải Nam',NULL,'$2a$10$t8xxL2url30XFDOzARfunOlCMA5OPUg2h0HQDwNgPgunYesEG8ie.','0983367055','USER','2026-05-12 13:39:05.841034','pillua9xzed8n70l'),(22,_binary '',_binary '','','2026-05-12 22:20:19.212768',_binary '','2026-05-29','thang102@gmail.com',_binary '\0','thang 5',NULL,'$2a$10$5N4QbRfWDD0rtPqOeFxC1uJW33VYJl1AVdWcRw4fqvKMijvinz2ZW','0555555555','PLAYER','2026-05-30 18:20:09.586497','v8v61pen3mo4howz'),(23,_binary '',_binary '',NULL,'2026-05-12 22:52:22.158802',_binary '',NULL,NULL,_binary '\0','thang 06',NULL,'$2a$10$fMxD3U022Hr2Zcksgv/wYuLt1mk5/YLlSXIgnKrLTcTfk2cznPJyW','0666666666','PLAYER','2026-05-17 14:08:32.555027','fzi9g9ah958jbe6k'),(24,_binary '',_binary '','','2026-05-13 09:16:18.479546',_binary '','2007-05-06','hainamnguyen1701@gmail.com',_binary '\0','Nguyễn Hải Nam (Tuấn test)','MALE','$2a$10$NzGJ8Jbx/eDrsaEUc3dxW.JPh.1L4IfNmQgYfuwzC4TFdUfTraT1K','0983367077','PLAYER','2026-05-17 14:08:28.454075','mtelfcnikke2z1wb'),(25,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/25_1778644790438_34422384.jpg','2026-05-13 10:59:19.973750',_binary '',NULL,NULL,_binary '\0','Lê Văn Tám (Tuấn test)',NULL,'$2a$10$D2MYlJYFrYy8vctOJtTAcu/RBMtKGuZUgDkSmldjj.rWrgtwg.F3e','0983367033','PLAYER','2026-05-13 11:00:14.568036','4oly659hnz7m2fyk'),(26,_binary '',_binary '',NULL,'2026-05-13 11:00:59.189721',_binary '',NULL,NULL,_binary '','Lê Văn Tám (Tuấn test)',NULL,'$2a$10$uYqKsTtWBpZKjW4yxZYjzuvMS.HVcSp2kNHZYDOGJWpsACFv492NG','0983367044','PLAYER','2026-05-13 11:00:59.189732','57ze51bxvv16dged'),(27,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/27_1778664483013_760aec39.jpg','2026-05-13 16:27:07.482138',_binary '','1987-08-22',NULL,_binary '\0','Thang 07','MALE','$2a$10$BvvYkejyXKDD9UCJMCwrmuZtOBy9.71O4t6jpZn6HSYxQYavdMakC','0777777777','PLAYER','2026-05-17 14:08:24.778431','2gnt0xzrimvg3bcz'),(28,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/28_1778683162084_e91ca8ed.jpg','2026-05-13 21:39:02.295887',_binary '',NULL,NULL,_binary '\0','Lê Văn Tám (Tuấn test)',NULL,'$2a$10$bDbvHmocZ1EN//ShLhcWv.8iJL/Op0R20wVM3vqiNKOW0tdproA9.','0983367022','PLAYER','2026-05-17 14:08:21.556802','ru9z0winiivbypdt'),(29,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/29_1778995755002_aa12ffd4.jpg','2026-05-17 12:26:46.500953',_binary '','2005-05-02','104993890@student.swin.edu.au',_binary '\0','Vũ Minh Tuấn','MALE','$2a$10$Gew3calpLpGLhvd5T0.qOebwuykZOAq9VcA1vStbMxT4zIrTq9UNO','0983367098','PLAYER','2026-05-18 16:22:30.738201','tffdzu57rl0ev4j4'),(30,_binary '',_binary '',NULL,'2026-05-17 14:12:50.407438',_binary '',NULL,NULL,_binary '\0','Vũ Minh Tuấn',NULL,'$2a$10$0ypB.JGJzQDbC6EvrzOSd.ND9pKNygO4ApHPK3oFOO.wwGmKdfRny','0912312322','PLAYER','2026-05-17 14:15:12.373290','15x5jcuecrfjx3dd'),(31,_binary '',_binary '',NULL,'2026-05-17 19:52:12.413812',_binary '','2011-05-06',NULL,_binary '','Phú Thái Doãn','MALE','$2a$10$bISsaAW//9O9UsEpsFsFnec8EljOve9Xl5n3a.YfvXRmNiNmZ4FSW','0915153634','PLAYER','2026-05-17 19:54:13.551482','pmbvxeli1orycbzo'),(32,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/32_1779031332721_cc2d2c10.jpeg','2026-05-17 22:05:22.119341',_binary '','2010-01-18','lethanhbinh181201@gmail.com',_binary '','Lê Thanh Bình','MALE','$2a$10$yPANvr6i.8XAXOVOM4gRguzodo1YXcAi8Tt922gzYLJWdtnSkANay','0932165400','PLAYER','2026-05-17 22:22:12.985684','qi27p9a6kga59jiu'),(33,_binary '',_binary '',NULL,'2026-05-17 22:08:49.809655',_binary '',NULL,NULL,_binary '','Đào Nhật Tiến',NULL,'$2a$10$Kyp3ebGvc/uYUM4esmiEX.tG1LiN3Z0cSLtD04CcRBsMrsrQvGZia','0868131727','PLAYER','2026-05-17 22:08:49.809702','7enlrydey06uh820'),(34,_binary '',_binary '',NULL,'2026-05-17 22:41:42.151612',_binary '',NULL,NULL,_binary '','Phan tấn Định',NULL,'$2a$10$6DZq6VXktfysXfPk5VD9QuTHeWSFODzxNXJZJAICCrjSQnG.qVI8C','0943101201','PLAYER','2026-05-17 22:41:42.151658','8ci46fw9hmrs3koq'),(35,_binary '',_binary '',NULL,'2026-05-17 22:48:24.694304',_binary '',NULL,NULL,_binary '','Phan tấn Đinhk',NULL,'$2a$10$wtGoByVtFm9G6VbY0AwMD.Xrm5CEOaunGuLsP9XPLyWG8ly4OXSq2','0826698571','USER','2026-05-17 22:48:24.694326','xsz4kq3xb6n3kj9v'),(36,_binary '',_binary '',NULL,'2026-05-18 15:41:07.161251',_binary '','2011-03-18','luongquyen16987@gmai.com',_binary '','Đầu Hoàng Quân','MALE','$2a$10$I89RgGJKGdC7dXlnWJBw9.rtk2nteY.IkbS84CARwxMDPKgHtptBa','0973078728','PLAYER','2026-05-18 15:45:59.261567','584haaelvozeueiq'),(37,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/37_1779096561668_ffecae4f.jpg','2026-05-18 16:23:26.621606',_binary '','2007-03-05','vucole816@gmail.com',_binary '\0','Vũ Minh Tuấn','MALE','$2a$10$IDSmRu1Wu6yfUtafGjAQT.U5h7JF6yzv8qvJ9Wq3qmTouE9pETxHW','0932132132','PLAYER','2026-05-18 16:31:12.104939','llw1a5upsiv0lmku'),(38,_binary '',_binary '',NULL,'2026-05-22 11:43:52.224227',_binary '',NULL,NULL,_binary '','Lê minh vũ',NULL,'$2a$10$Mqb620ZeCnxYquu/.vzAQ.UTvhgO2LdVrsaZCelCHOm0fwJfjhHj.','0366092725','PLAYER','2026-05-22 11:43:52.224247','96xem02g2cl1em8u'),(39,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/39_1779428561769_846b74c0.jpg','2026-05-22 12:32:30.888085',_binary '','2012-01-14','phungtaiphau@gmail.com',_binary '','Phùng Tuệ Nguyên','MALE','$2a$10$y.nrdvBNjqYMIh56.p.ciOjj56yVNitQkgORV46OtM5jzyrxKKT1O','0938636009','USER','2026-05-22 12:42:42.236907','3a86ndupr7w4yjm8'),(40,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/40_1779430496640_15bc5d7e.jpg','2026-05-22 12:44:40.372828',_binary '','2012-01-15','phungtaiphau@gmail.com',_binary '','Phùng Tuệ Nguyên','MALE','$2a$10$0Ii16IaUxBrb31.wDC7Vlu4bBLEyIptxKY3bZzQzLRDu4XS0F.Due','0971719711','PLAYER','2026-05-22 13:14:57.085238','7klf3y9id8oimtbm'),(41,_binary '',_binary '',NULL,'2026-05-26 16:45:55.319443',_binary '','2005-12-31',NULL,_binary '\0','Nguyễn Văn A','MALE','$2a$10$jWs8gJJ4oDtZG2Ptjkidq.sscD4MOBHZvsILNEQ9QQ1zwdKmZBlrS','0935805107','PLAYER','2026-05-31 12:26:18.225879','e7vco8dpn0hbvtpy'),(42,_binary '',_binary '',NULL,'2026-05-28 12:41:02.111726',_binary '','2011-09-17',NULL,_binary '','Huỳnh võ văn phúc','MALE','$2a$10$5SBJUe04Ahim8e2EcxhNYeM2ey676E8HBx5vsVRkY5LU6diF23vgu','0934907703','PLAYER','2026-05-28 12:43:57.455534','gfv39xjqglp4tdo5'),(43,_binary '',_binary '','','2026-06-01 12:13:13.021402',_binary '','2005-03-19','vu051431@gmail.com',_binary '\0','Vũ Minh Tuấn','MALE','$2a$10$13XG/v3rAhWfxB9tdn81BuWn3CS3FgJNV0f/5RzV0H17oN3dTya/i','0983367096','PLAYER','2026-06-01 12:24:33.375967','nw05p8qoy00j3lin'),(44,_binary '',_binary '','https://11of.s3.ap-southeast-1.amazonaws.com/avatars/44_1780465153961_ea0c9fba.png','2026-06-03 12:25:17.843769',_binary '',NULL,NULL,_binary '','Tran Minh Giang',NULL,'$2a$10$QYOGn6BM36KkDkV/WJAU1ehrkttU9blsYvNdpaF2wdcpYpIbXXtny','0901070549','USER','2026-06-03 12:39:29.741877','1qbvz8c22fpcgfwj');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-06  2:27:48
