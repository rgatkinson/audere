import os
import argparse
import sys
import re
import datetime
import subprocess
from glob import glob


now = datetime.datetime.now()
header_text = [" Copyright (c) " + str(now.year) + " by Audere", "", 
" Use of this source code is governed by an MIT-style license that", 
" can be found in the LICENSE file distributed with this file."]

# File extensions that we care about
source_file_extensions = (".ts", ".tsx", ".js", ".jsx", ".sh", ".py", ".html", ".css")

parser = argparse.ArgumentParser(description="Run this script from the working dir you want to recursively search.")
parser.add_argument("--verbose", action="store_true", help="Report how each file was processed.")
args = parser.parse_args()

statusEdited = 1
statusSkipped = 2
statusNoNeedToEdit = 3
def reportStatus(path, status): 
    if status == statusEdited: 
        print("*** Edited " + path)
    elif args.verbose: 
        if status == statusSkipped:
            print("Skipped " + path)
        elif status == statusNoNeedToEdit: 
            print("OK " + path)

def editFile(path):
    f = open(path, "r")
    try:
        text = f.readlines()
    except:
        sys.stderr.write("Could not read file\n")
        return
    f.close()
    if(len(text) == 0):
        reportStatus(path, statusNoNeedToEdit)
        return
    search_length = 5
    header_found = False
    for i in range(search_length if len(text)>=search_length else len(text)):
        old_str = re.search(r"\W*Copyright\s+\(c\)\s+(?P<year1>\d{4})(?P<year2>\s*[-,]\s*\d{4})? by Audere",
            text[i])
        if old_str is None:
            continue
        
        if str(now.year) in old_str.string:
            reportStatus(path, statusNoNeedToEdit)
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
        f.close()
        reportStatus(path, statusEdited)
    else: 
        reportStatus(path, statusNoNeedToEdit)

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

list_of_git_files = subprocess.check_output("git ls-files", shell=True).splitlines()
for filename in list_of_git_files:
    path = "./" + filename.decode()
    if path.endswith(source_file_extensions):
        editFile(path)
    else: 
        reportStatus(path, statusSkipped)
        