import argparse
import json
import sys

from pprint import pprint

def output_csv_row(prefix, json_object, outfile):
    for key, value in sorted(json_object.items()):
        if isinstance(value, dict):
            new_prefix = (prefix + ':' if prefix else '') + key
            output_csv_row(new_prefix, value, outfile)
        else:
            assert isinstance(value, str) or isinstance(value, unicode)
            escaped_value = value.replace('\n', '\\n')
            
            # Commas need special escaping.  When we have commas, we enclose the
            # whole thing in quotes, which then requires escaping inner quotes.
            if ',' in escaped_value:
                escaped_value = '"' + escaped_value.replace('"', '""') + '"'

            line = prefix + ':' + key + ',' + escaped_value + '\n';
            outfile.write(line.encode('utf8'))

parser = argparse.ArgumentParser(description='Converts locale json into a CSV for translation')
parser.add_argument('infile', type=argparse.FileType('r'), default=sys.stdin, help='The input locale file')
parser.add_argument('outfile', type=argparse.FileType('w'), default=sys.stdout, help='The output csv file')

args = parser.parse_args()

data = json.load(args.infile)

output_csv_row(None, data, args.outfile)

