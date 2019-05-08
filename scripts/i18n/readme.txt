To convert i18n string files from JSON to CSV:

  ./json2csv [FluTrack|FluStudy_au] 

  This will convert /src/i18n/locales/*.json into csv. You can then upload the CSV to Google Drive and open as Sheets. 


To convert CSV back to JSON: 

  1. Save the Google Sheets doc as an .xlsx file. 

  2. Download LibreOffice Calc.  https://www.libreoffice.org/download/download/

  3. Use LibreOffice to open the .xlsx file and Save as... Text CSV. 

       If asked whether you want to use ODF format, choose Use Text CSV Format

       Use the default Field options of Character Set = UTF8, Field delimiter = , String delimiter = " 

       Make sure "Save cell content as shown" and "Quote all text cells" are checked 

  4. i18next-json-csv-converter [csv you saved] [target json filename] 

       This assumes you have run ./json2csv at least once which installs i18next-json-csv-converter


i18n Script Wish List:

  Script that detects unused keys 

  Script that extracts only changed/new keys since last time into CSV
   
