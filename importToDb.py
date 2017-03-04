import glob
import os
import pickle

import pandas as pd
import psycopg2
import pytz
import concurrent.futures


base_path = "/Users/sche/db/csv/"
csv_files = glob.glob(base_path + "**/*.csv.gz")
csv_files.sort()

SAVE_FILE = "progress.bin"

jobs = []
first_time = True

if os.path.exists(SAVE_FILE):
    last_imported_file = pickle.load(open(SAVE_FILE, "rb"))
    resume = False
else:
    last_imported_file = None
    resume = True

for csv_file in csv_files:
    if not resume:
        if csv_file == last_imported_file:
            resume = True

        continue

    if first_time:
        first_time = False
        with psycopg2.connect(database='postgres', user='sche', password='', host='localhost') as cnx:
            try:
                print("Drop index")
                with cnx.cursor() as c:
                    c.execute("DROP INDEX public.mobike_bikeid_index;")
                    c.execute("DROP INDEX public.mobike_time_index;")
            except Exception as ex:
                print(ex)
                cnx.commit()
                pass
            print("Done drop index")

    jobs.append(csv_file)

def run(csv_file):
    with psycopg2.connect(database='postgres', user='sche', password='', host='localhost') as cnx:
        temp_file = "/tmp/" + os.path.basename(csv_file)
        tz = pytz.timezone("Asia/Shanghai")

        try:
            print("Importing " + csv_file)
            df = pd.read_csv(csv_file, index_col=0,
                             names=["bikeid", "biketype", 'distid', 'distnum', 'type', "lon", "lat"],
                             parse_dates=True)
            df.drop_duplicates(subset=['distid', 'lon', 'lat'], inplace=True)
            df = df[["biketype", 'distid', "lon", "lat"]]
            df.tz_localize(tz)

            cursor = cnx.cursor()

            df.to_csv(temp_file, header=False, date_format="%Y-%m-%d %H:%M:%S")

            sql = "COPY mobike FROM '%s' DELIMITER ',' CSV; " % (temp_file)

            cursor.execute(sql)
        except Exception as ex:
            print(ex)
        finally:
            cnx.commit()
            last_imported_file = csv_file
            pickle.dump(last_imported_file, open(SAVE_FILE, "wb"))
            os.remove(temp_file)

with concurrent.futures.ProcessPoolExecutor(max_workers=6) as executor:
    executor.map(run, jobs)

if not first_time:
    with psycopg2.connect(database='postgres', user='sche', password='', host='localhost') as cnx:
        with cnx.cursor() as c:
            print("Creating index")
            c.execute("CREATE INDEX mobike_bikeid_index ON mobike (distid);")
            c.execute("CREATE INDEX mobike_time_index ON mobike (time);")
            cnx.commit()

print("Done")
