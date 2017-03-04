class Utility {
    static getHost = ()=> {
        return process.env.REACT_APP_SERVER || "http://localhost:8100";
    }

    static DATE_FORMAT = "YYYY-MM-DD";
    static DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
    static DATETIME_HOUR_FORMAT = "YYYY-MM-DD HH:00:00";
}

export default Utility