import React, {Component} from "react";
import "./App.css";
import {debounce, cloneDeep, maxBy} from "lodash";
import Utility from "./Utility";
import moment from "moment/min/moment-with-locales";

const AMap = global.AMap;

class HeatMap extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.map = new AMap.Map('heat-map', {
            zoom: 14,
            showBuildingBlock: true,
            expandZoomRange: true,
            center: [104.065735, 30.659462]
        });

        this.map.setMapStyle('dark');

        this.heatmap = null;
        this.map.plugin(["AMap.Heatmap"], ()=> {
            //初始化heatmap对象
            this.heatmap = new AMap.Heatmap(this.map, {
                radius: 150, //给定半径
                opacity: [0, 0.8]
            });

            this.heatmap.show()
        });

        this.loadHeatMap();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props != nextProps) {
            this.loadHeatMap();
        }
    }

    loadHeatMap = debounce(()=> {
        fetch(Utility.getHost() + "/heatmap?at=" + this.props.date.clone().format(Utility.DATETIME_HOUR_FORMAT)).then((resp)=> {
            return resp.text()
        }).then((j)=> {
            let heatmapData = JSON.parse(j).result;
            this.heatmap.setDataSet({max: 500, min: 0, data: heatmapData})
        })
    }, 100)

    render() {
        const full = {
            width: "100%",
            height: "100%",
        };

        return (
            <div style={full}>
                <div id="heat-map" style={full}></div>
            </div>
        )
    }
}

export default HeatMap;