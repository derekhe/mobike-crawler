import React, {Component} from "react";
import {debounce, cloneDeep, isEqual} from "lodash";
import Utility from "./Utility";
import moment from "moment";
const AMap = global.AMap;
const DAYS_AHEAD = 7;

class IdSearch extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.initMap();
        this.initMarkers();
    }

    componentWillReceiveProps(nextProps) {
        if (!isEqual(this.props, nextProps)) {
            this.getBikeDetails();
        }
    }

    initMarkers() {
        this.bicycleMarker = new AMap.Marker({
            map: this.map,
            icon: new AMap.Icon({
                image: "icon.png",
                size: new AMap.Size(64, 64),  //图标大小
                imageSize: new AMap.Size(48, 48)
            }),
            offset: new AMap.Pixel(-24, -24),
            zIndex: -100
        });
        this.bicycleMarker.hide();

        this.currentPosMarker = new AMap.Marker({
            map: this.map,
            icon: new AMap.Icon({
                image: "select.png",
                size: new AMap.Size(140, 140),  //图标大小
                imageSize: new AMap.Size(48, 48)
            }),
            offset: new AMap.Pixel(-24, -48)
        });
        this.currentPosMarker.hide();

        this.infoWindow = new AMap.InfoWindow({offset: new AMap.Pixel(0, -30)});
    }

    initMap() {
        this.map = new AMap.Map('id-search', {
            zoom: 14,
            showBuildingBlock: true,
            expandZoomRange: true,
            center: [104.065735, 30.659462]
        });

        this.map.setMapStyle('light');
    }

    getBikeDetails = debounce(() => {
        if (!this.props.bikeId) return;

        const fromDate = this.props.beginDate.format(Utility.DATE_FORMAT);
        const toDate = this.props.endDate.clone().add(1,'days').format(Utility.DATE_FORMAT);

        fetch(Utility.getHost() + "/bike/" + this.props.bikeId + "?from=" + fromDate + "&to=" + toDate).then((resp)=> {
            return resp.text()
        }).then((j)=> {
            var raw = JSON.parse(j);
            let routes = raw.result;

            let positions = routes.map((r)=> {
                return r.pos;
            });

            this.currentPosMarker.hide();

            this.bicycleMarker.show();
            this.bicycleMarker.stopMove();

            if (!this.polyline) {
                this.polyline = new AMap.Polyline({
                    path: positions,          //设置线覆盖物路径
                    strokeColor: "#0074D9", //线颜色
                    strokeOpacity: 0.9,       //线透明度
                    strokeWeight: 2,        //线宽
                    strokeStyle: "solid",   //线样式
                    outlineColor: "#7FDBFF",
                    isOutline: true,
                });
                this.polyline.setMap(this.map);
            } else {
                this.polyline.setPath(positions)
            }

            if (positions.length != 0) {
                this.bicycleMarker.moveAlong(positions, 5000);
            }

            this.clearRouteMarkers();
            this.infoWindow.close();

            routes.forEach((r, index)=> {
                let m = new AMap.Marker({
                    position: [r.pos[0], r.pos[1]],
                    zIndex: 0
                });
                m.setMap(this.map);
                m.setLabel({
                    offset: new AMap.Pixel(3, 0),
                    content: index + 1
                });
                var date_start = moment(r.time).format("MM-DD HH:mm");
                var date_stay = Math.round(moment.duration(r.wait_time, 'seconds').asHours());

                if (r.wait_time != 0) {
                    m.content = `<div>${date_start}停在此地</div><div>停留:${date_stay}小时</div>`;
                }
                else {
                    m.content = `<div>${date_start}停在此地至今</div>`;
                }

                m.on('click', (e)=> {
                    this.infoWindow.setContent(e.target.content);
                    this.infoWindow.open(this.map, e.target.getPosition());
                });

                this.markers.push(m);
            });

            this.map.setFitView();
        })
    }, 100);

    clearRouteMarkers() {
        if (this.markers) {
            this.markers.forEach((m)=> {
                m.setMap(null);
                m = null;
            })
        }
        else {
            this.markers = [];
        }
    }

    clearBikeMarkers() {
        if (this.bikesMarkers) {
            this.bikesMarkers.forEach((m)=> {
                m.setMap(null);
                m = null;
            })
        }
        else {
            this.bikesMarkers = [];
        }
    }

    render() {
        const style = {
            width: "100%",
            height: "100%"
        };

        return (
            <div id="id-search" style={style}></div>
        )
    }
}

export default IdSearch;
