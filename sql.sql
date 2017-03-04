CREATE TABLE mobike
(
  time     TIMESTAMP WITH TIME ZONE NOT NULL,
  biketype SMALLINT                 NOT NULL,
  distid   INTEGER,
  lon      DOUBLE PRECISION         NOT NULL,
  lat      DOUBLE PRECISION         NOT NULL
);
