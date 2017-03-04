import React, {Component} from "react"

class Home extends Component {
    constructor(props){
        super(props)
    }

    render() {
        const style = {
            width: "100%",
            height: 768,
        }

        const bigFont ={
            fontSize: "500%",
            textAlign: "center"
        }

        const center = {
            textAlign: "center"
        }

        return (<div style={style}>
            <h1 style={bigFont}>数据摩拜</h1>
            <h2 style={center}>用数据说话</h2>
            <h5 style={center}>最后更新:{this.props.latestDate}</h5>
        </div>)
    }
}

export default Home