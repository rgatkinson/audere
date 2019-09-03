import os
import argparse
import sys
import re
import datetime
from glob import glob


now = datetime.datetime.now()
header_text = [" Copyright (c) " + str(now.year) + " by Audere", "", 
" Use of this source code is governed by an MIT-style license that", 
" can be found in the LICENSE file distributed with this file."]

parser = argparse.ArgumentParser()
parser.add_argument("inputfilespec", nargs='+')
parser.add_argument("-r", nargs=1, help="Enables it to search through directories recursivly, give path to starting directory")
args = parser.parse_args()
recursive = args.r
wildcard_pattern = args.inputfilespec
search_length = 5

def editFile(path):
    
    f = open(path, "r")
    try:
        text = f.readlines()
    except:
        sys.stderr.write("Could not read file\n")
        return
    f.close()
    if(len(text) == 0):
        return
    header_found = False
    for i in range(search_length if len(text)>=search_length else len(text)):
        old_str = re.search(r"\W*Copyright\s+\(c\)\s+(?P<year1>\d{4})(?P<year2>\s*[-,]\s*\d{4})? by Audere",
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
        if(text[0].startswith("#!")):
            text.insert(1, createHeader(path))
        else:
            text.insert(0, createHeader(path))

    f = open(path, "w")
    f.writelines(text)
    print("Edited " + path)
    f.close()

def createHeader(file):
    header = ""
    comment_type = "//"
    is_block = False
    if file.endswith(".py") or file.endswith(".sh"):
        comment_type = "#"
    if file.endswith(".css"):
        comment_type = "*/"
        is_block = True
        header = "/* \n"
    if file.endswith(".html"):
        comment_type = "-->"
        is_block = True
        header = "<!-- \n"
    for line in header_text:
        header += (comment_type if not is_block else "") + line + "\n"
    if is_block:
        header += comment_type + "\n"
    return header

def processDirectory(path):
    for pattern in wildcard_pattern:
        for filename in glob(os.path.join(path, pattern)):
            if not os.path.isdir(filename):
                editFile(filename)

if recursive is not None:
    for (subdir, dirs, files) in os.walk(recursive[0]):
        processDirectory(subdir)
else:
    processDirectory(".")