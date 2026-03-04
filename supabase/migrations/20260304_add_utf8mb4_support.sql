/*
  # Add UTF-8MB4 Support for Arabic Characters

  1. Changes
    - Alter boxes table to support UTF-8MB4
    - Alter parcels table to support UTF-8MB4
    - Alter archived_parcels table to support UTF-8MB4

  2. Notes
    - UTF-8MB4 allows full Unicode support including Arabic, Emoji, etc.
*/

-- Alter tables to use UTF-8MB4 charset
ALTER TABLE boxes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE parcels CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE archived_parcels CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Alter specific columns to ensure they use UTF-8MB4
ALTER TABLE boxes MODIFY name TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE parcels MODIFY tracking TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE parcels MODIFY boutique TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE parcels MODIFY wilaya_destinataire TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE parcels MODIFY commune TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE parcels MODIFY id_vendeur TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE parcels MODIFY bureau_destinataire TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE parcels MODIFY centre_retour TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE parcels MODIFY phone_client TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE archived_parcels MODIFY tracking TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE archived_parcels MODIFY boutique TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE archived_parcels MODIFY box_name TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
