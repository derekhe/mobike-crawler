import React, {Component} from "react";
import "./App.css";
import moment from "moment/min/moment-with-locales";
import {debounce, cloneDeep} from "lodash";
import MapSearch from "./MapSearch";
import HeatMap from "./HeatMap";
import {Tabs, Tab} from "material-ui/Tabs";
import Slider from "material-ui/Slider";
import Toggle from "material-ui/Toggle";
import Home from "./Home";
import Utility from "./Utility";
import IdSearch from "./IdSearch";
import TextField from "material-ui/TextField";
import DatePicker from "material-ui/DatePicker";


const AMap = global.AMap;
moment.locale("zh-cn");

class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            offset: 0,
            detail: {},
            latestDate: moment(),
            beginDate: moment().subtract(7, 'days'),
            endDate: moment()
        }
    }

    componentDidMount() {
        this.updateLatestDate();
        this.onToggleAnimation(null, true);

    }

    updateLatestDate() {
        fetch(Utility.getHost() + "/latest").then((resp) => {
            return resp.text()
        }).then((j) => {
            let latest = JSON.parse(j).result;
            this.setState({latestDate: moment(latest)})
        })
    }

    onSliderChange = (event, newVal) => {
        this.setState({offset: newVal});
    }

    onToggleAnimation = (event, value) => {
        if (value) {
            this.state.offset = 48;
            this.timer = setInterval(() => {
                var newVal = (this.state.offset - 1) % 48;
                if (newVal < 0) {
                    newVal = 48
                }
                this.onSliderChange(event, newVal)
            }, 3000)
        }
        else {
            clearTimeout(this.timer);
        }
    }

    onBikeDetailUpdated = (detail) => {
        this.setState({detail: detail});
    }

    onUserInputId = (event, newValue) => {
        this.setState({userInputId: newValue})
    }

    onBeginDateChange = (event, newDate) => {
        this.setState({beginDate: moment(newDate)})
    }

    onEndDateChange = (event, newDate) => {
        this.setState({endDate: moment(newDate)});
    }

    render() {
        let descritpion = null;
        var id = this.state.detail.id;
        if (id) {
            descritpion = <h5>当前单车编号:{id}<br/>
                7天内它已经走过的距离约为{Math.ceil(this.state.detail.stats.travel_distance * 2 / 1000)}km<br/>
            </h5>
        } else {
            descritpion = <h5>
                拖动地图显示当前范围内200台单车位置<br/>
                点击单车图标显示单车如何到达此地<br/>
                点击冒泡图标显示详情<br/>
            </h5>
        }

        let heatMapDate = this.state.latestDate.clone().subtract(this.state.offset, 'hours');
        return (

            <div>
                <div className="title">
                    <Home latestDate={this.state.latestDate.format(Utility.DATETIME_FORMAT)}/>
                </div>
                <div className="odd page">
                    <div className="odd-text">
                        <h1>单车地图</h1>
                        <h3>每台单车都有自己独特的风景</h3>
                        {descritpion}
                    </div>
                    <div className="map-search">
                        <MapSearch onBikeDetailUpdated={this.onBikeDetailUpdated} latestDate={this.state.latestDate}/>
                    </div>
                </div>

                <div className="page">
                    <div className="even-text">
                        <h1>单车轨迹</h1>
                        <h3>每台单车都有自己独特的风景</h3>
                        <div className="one-line">
                            <TextField onChange={this.onUserInputId}
                                       floatingLabelText="单车编号:2800xxxxx"/>
                            <DatePicker floatingLabelText="轨迹开始日期" onChange={this.onBeginDateChange}
                                        defaultDate={this.state.beginDate.toDate()}/>
                            <DatePicker floatingLabelText="轨迹结束日期" onChange={this.onEndDateChange}
                                        defaultDate={this.state.endDate.toDate()}/>
                        </div>
                    </div>
                    <div className="map-search">
                        <IdSearch bikeId={this.state.userInputId} beginDate={this.state.beginDate}
                                  endDate={this.state.endDate}/>
                    </div>
                </div>

                <div className="odd page">
                    <div className="odd-text">
                        <h1>单车热力图</h1>
                        <h5>
                            热力图显示了单车的聚集程度<br/>
                            单车越多颜色越红<br/>
                            试试拖动地图查看城市不同的区域的热力图动画<br/>
                        </h5>
                    </div>
                    <div className="heat-map">
                        <div className="heat-map-head">
                            <Slider value={this.state.offset} axis="x-reverse" max={48} min={0}
                                    onChange={this.onSliderChange} className="slider"
                                    sliderStyle={{marginTop: 0, marginBottom: 0}}
                            />
                            <h6 style={{margin: 0}}>{heatMapDate.format(Utility.DATETIME_FORMAT)}</h6>
                            <Toggle
                                label="动画"
                                onToggle={this.onToggleAnimation}
                                className="toggle"
                                defaultToggled={true}
                            />

                        </div>
                        <HeatMap date={heatMapDate}/>
                    </div>
                </div>
                <div className="footer">
                    <p>
                        所有数据仅供研究用途<br/>
                    </p>
                </div>
            </div>
        );
    }
}

export default App;
