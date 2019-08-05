import os
import argparse

header_text = "// Copyright (c) 2019 by Audere\n//\n// Use of this source code is governed by an MIT-style license that\n// can be found in the LICENSE file distributed with this file.\n"

parser = argparse.ArgumentParser()
parser.add_argument("inputfile")
test_path = parser.parse_args().inputfile
#print(test_path.inputfile)

def editFile(path):
    
    f = open(path, "r")
    text = f.readlines()
    text.insert(0, header_text)
    f.close()

    f = open("test.txt", "w")
    f.writelines(text)
    f.close()

for (subdir, dirs, files) in os.walk(".."):
    for file in files:
        filepath = subdir + os.sep + file
        #print(filepath)

editFile(test_path)
