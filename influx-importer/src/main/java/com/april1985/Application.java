package com.april1985;

import org.influxdb.InfluxDB;
import org.influxdb.InfluxDBFactory;
import org.influxdb.dto.BatchPoints;
import org.influxdb.dto.Point;
import org.joda.time.DateTime;

import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.LinkedList;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.zip.GZIPInputStream;

/**
 * Created by sche on 02/02/2017.
 */
public class Application {
    public static void main(String[] args) throws Exception {
        ThreadPoolExecutor threadPoolExecutor = new ThreadPoolExecutor(4, 4, 60, TimeUnit.SECONDS, new LinkedBlockingQueue<>());
        String glob = "glob:**/*.csv.gz";
        String input = "/Users/sche/db/csv";
        LinkedList<String> csvFiles = match(glob, input);

        for (String csvFile : csvFiles) {
            threadPoolExecutor.execute(() -> {
                try {
                    InfluxDB influxDB = InfluxDBFactory.connect("http://127.0.0.1:8086", "root", "root");
                    String dbName = "mobike";
                    influxDB.createDatabase(dbName);
                    influxDB.enableGzip();
                    influxDB.enableBatch(5000, 1, TimeUnit.SECONDS);

                    System.out.println(csvFile);
                    InputStream fileStream = new FileInputStream(csvFile);
                    InputStream gzipStream = new GZIPInputStream(fileStream);
                    Reader decoder = new InputStreamReader(gzipStream, "UTF-8");
                    BufferedReader buffered = new BufferedReader(decoder);

                    String lineRead = buffered.readLine();
                    while (lineRead != null) {
                        String[] split = lineRead.split(",");
                        Long time = DateTime.parse(split[0]).getMillis();
                        String type = split[2];
                        String id = split[3];
                        Float lon = Float.valueOf(split[6]);
                        Float lat = Float.valueOf(split[7]);

                        Point point = Point.measurement("mobike")
                                .time(time, TimeUnit.MILLISECONDS)
                                .tag("type", type)
                                .tag("id", id)
                                .addField("lon", lon)
                                .addField("lat", lat)
                                .build();

                        influxDB.write(dbName, "autogen", point);
                        lineRead = buffered.readLine();
                    }

                    System.out.println("Store");

                    buffered.close();
                }catch(Exception ex){
                    System.out.println(ex.toString());
                }
            });
        }
    }

    private static LinkedList<String> match(String glob, String location) throws IOException {
        final LinkedList<String> matchedFiles = new LinkedList<String>();
        final PathMatcher pathMatcher = FileSystems.getDefault().getPathMatcher(
                glob);

        Files.walkFileTree(Paths.get(location), new SimpleFileVisitor<Path>() {

            @Override
            public FileVisitResult visitFile(Path path,
                                             BasicFileAttributes attrs) throws IOException {
                if (pathMatcher.matches(path)) {
                    matchedFiles.push(path.toString());
                }
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFileFailed(Path file, IOException exc)
                    throws IOException {
                return FileVisitResult.CONTINUE;
            }
        });

        return matchedFiles;
    }
}
