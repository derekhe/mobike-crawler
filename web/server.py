import datetime
import logging

import pandas as pd
import psycopg2
import psycopg2.extras
import pytz
from flask import Flask, jsonify
from flask import request
from flask_cors import CORS
from geopy.distance import great_circle
from werkzeug.contrib.cache import SimpleCache
from flask_compress import Compress

cache = SimpleCache()

app = Flask(__name__)
CORS(app)
Compress(app)

tz = pytz.timezone("Asia/Shanghai")

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

ch = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s:')
ch.setFormatter(formatter)
logger.addHandler(ch)


@app.route('/bike/<id>')
def find_bikes(id):
    if len(id) != 9:
        return jsonify({"result": []})

    date_from = request.args.get("from")
    date_to = request.args.get("to")

    key = '%s-%s-%s' % (id, date_from, date_to)
    rv = cache.get(key)

    if rv is None:
        with connect() as cnx:
            with cnx.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                query = "SELECT * FROM mobike WHERE distid = " + id

                if date_from is not None and date_to is not None:
                    query += " AND TIME BETWEEN '%s' AND '%s' " % (date_from, date_to)

                query += " ORDER BY time ASC"
                print(query)
                cursor.execute(query)
                result = cursor.fetchall()
                logger.debug("Done query " + query)

                response = []

                last_pos = (0, 0)
                last_time = None
                wait = False
                wait_time = datetime.timedelta()
                wait_times = []

                total_travel_distance = 0
                for r in result:
                    current_pos = (r['lon'], r['lat'])
                    travel_distance = great_circle(current_pos, last_pos).meters
                    if travel_distance < 100:
                        wait = True
                        continue

                    if wait:
                        wait = False
                        wait_time = r['time'] - last_time

                    if last_pos != (0, 0):
                        total_travel_distance += travel_distance

                    last_pos = current_pos
                    last_time = r['time']
                    response.append({
                        "time": r['time'].isoformat(),
                        "pos": current_pos,
                    })

                    wait_times.append(wait_time.total_seconds())

                wait_times.append(0)

                logger.debug("Done calc " + query)

                for i in range(0, len(response)):
                    response[i]['wait_time'] = wait_times[i + 1]

                rv = jsonify({"result": response, "stats": {"travel_distance": total_travel_distance}})
                cache.set(key, rv, timeout=30 * 60)

    return rv


@app.route('/bikes')
def find_in_range():
    (n, e) = request.args.get("ne").split(',')
    (s, w) = request.args.get("sw").split(',')
    time = int(request.args.get('time'))
    format = "%Y-%m-%d %H:%M:%S"
    t1 = datetime.datetime.fromtimestamp(time)
    t2 = t1 - datetime.timedelta(hours=0.5)
    with connect() as cnx:
        with cnx.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
            query = "select * from mobike where (lon > %f and lon < %f) and ( lat > %f and lat < %f) and time between '%s' and '%s' order by distid limit 200" % (
                float(s), float(n), float(w), float(e), datetime.datetime.strftime(t2, format),
                datetime.datetime.strftime(t1,
                                           format))

            logger.debug(query)
            cursor.execute(query)
            logger.debug("Done " + query)
            result = cursor.fetchall()

            response = []

            for r in result:
                response.append({
                    "id": r['distid'],
                    "pos": (r['lon'], r['lat'])
                })

            return jsonify({"result": response})


@app.route('/latest')
def latest():
    with connect() as cnx:
        with cnx.cursor() as cursor:
            cursor.execute('SELECT time FROM mobike ORDER BY time DESC LIMIT 1')
            result = cursor.fetchall()

            return jsonify({"result": result[0][0].isoformat()})


@app.route('/randomid')
def randomId():
    with connect() as cnx:
        with cnx.cursor() as cursor:
            cursor.execute('SELECT distid FROM mobike OFFSET floor(random()*10000) LIMIT 1;')
            result = cursor.fetchall()

            return jsonify({"result": result[0][0]})


@app.route('/heatmap')
def heatmap():
    at = request.args.get("at")
    date_to = datetime.datetime.strptime(at, "%Y-%m-%d %H:%M:%S")
    date_from = date_to - datetime.timedelta(hours=1)

    rv = cache.get(at)

    if not rv is None:
        logger.debug(at + "From cache")
        return rv

    with connect() as cnx:
        with cnx.cursor() as cursor:
            query = "SELECT DISTINCT ON (distid) lon, lat from mobike where time between '%s' and '%s'" % (
            date_from, date_to)
            logger.debug(query)
            cursor.execute(query)
            logger.debug("Done" + query)

            df = pd.DataFrame(cursor.fetchall())
            step = 0.008
            df = df.apply(lambda x: round(x / step) * step)
            if df.empty:
                return jsonify({"result": []})

            df = df.groupby(df.columns.tolist(), as_index=True).size().reset_index(name='count')
            df.columns = ['lng', 'lat', 'count']
            result = '{"result":' + df.to_json(orient="records") + "}"
            logger.debug("Set cache")
            cache.set(at, result)
            return result

def connect():
    return psycopg2.connect(database='postgres', user='sche', password='', host='localhost')

if __name__ == "__main__":
    app.run(host="0.0.0.0",port=8100, threaded=True)
