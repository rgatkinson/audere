import os
import argparse
import sys
import re
import datetime

now = datetime.datetime.now()
header_text = [" Copyright (c) " + str(now.year) + " by Audere", "", 
" Use of this source code is governed by an MIT-style license that", 
" can be found in the LICENSE file distributed with this file."]

parser = argparse.ArgumentParser()
parser.add_argument("inputfile")
test_path = parser.parse_args().inputfile
search_length = 5

def editFile(path):
    
    f = open(path, "r")
    try:
        text = f.readlines()
    except:
        sys.stderr.write("Could not read file")
        return
    f.close()
    header_found = False
    for i in range(search_length if len(text)>=search_length else len(text)):
        old_str = re.search(r"\W+?Copyright\s+\(c\)\s+(?P<year1>\d{4})(?P<year2>\s*-\s*\d{4})? by Audere",
            text[i])
        if old_str is None:
            continue
        if str(now.year) in old_str.string:
            return
            
        years = list(old_str.groups())
        years[1] = str(now.year)
        new_str = re.sub(r"\d{4}(\s*-\s*\d{4})?", years[0] + "-" + years[1], old_str.string)
        text[i] = new_str
        header_found = True
        break
    if not header_found:
        print("Create new header")
        if(text[0].startswith("#!")):
            text.insert(1, header_text[0])
        else:
            text.insert(0, header_text[0])

    f = open("test.txt", "w")
    f.writelines(text)
    f.close()

for (subdir, dirs, files) in os.walk(".."):
    for file in files:
        filepath = subdir + os.sep + file
        #editFile(filepath)
        #print(filepath)
editFile(test_path)
