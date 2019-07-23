import PropTypes from 'prop-types';
import React from 'react';
import Datamaps from 'datamaps';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import './DataMaps.scss';
import * as d3 from "d3";
import Button from 'react-bootstrap/Button';

const MAP_CLEARING_PROPS = [
    'height', 'scope', 'setProjection', 'width'
];

const propChangeRequiresMapClear = (oldProps, newProps) => {
    return MAP_CLEARING_PROPS.some((key) =>
        oldProps[key] !== newProps[key]
    );
};

export default class Datamap extends React.Component {

    static propTypes = {
        arc: PropTypes.array,
        arcOptions: PropTypes.object,
        bubbleOptions: PropTypes.object,
        bubbles: PropTypes.array,
        data: PropTypes.object,
        graticule: PropTypes.bool,
        height: PropTypes.any,
        labels: PropTypes.bool,
        responsive: PropTypes.bool,
        style: PropTypes.object,
        updateChoroplethOptions: PropTypes.object,
        width: PropTypes.any
    };


    componentDidMount() {
        window.addEventListener('resize', this.resizeMap);
        console.log(this.props)
        this.drawMap();
    }

    componentDidUpdate() {
        this.drawMap();
    }

    componentWillReceiveProps(newProps) {
        if (propChangeRequiresMapClear(this.props, newProps)) {
            this.clear();
        }
    }

    componentWillUnmount() {
        this.clear();
        window.removeEventListener('resize', this.resizeMap);

    }

    clear() {
        const { container } = this.refs;

        for (const child of Array.from(container.childNodes)) {
            container.removeChild(child);
        }

        delete this.map;
    }

    drawMap() {
        const {
            arc,
            arcOptions,
            bubbles,
            bubbleOptions,
            data,
            graticule,
            labels,
            updateChoroplethOptions,
            ...props
        } = this.props;

        let map = this.map;

        if (!map) {
            map = this.map = new Datamaps({
                ...this.props,
                fills: {
                    defaultFill: "#BDBDBB",
                    areaColor: "#CADCEB",
                    countryColor: "#FCCAC6"
                },
                element: this.refs.container
            });
        } else {
            map.updateChoropleth(data, updateChoroplethOptions);
        }

        if (arc) {
            map.arc(arc, arcOptions);
        }

        if (bubbles) {
            map.bubbles(bubbles, bubbleOptions);
        }

        if (graticule) {
            map.graticule();
        }

        if (labels) {
            map.labels();
        }
    }

    resizeMap = () => {
        this.map.resize();
    }

    handleDownload = async () => {
        console.log(this.props.data)
        let dataForJson = []//[ ...this.props.data];
        // dataForJson = dataForJson.map(x => { 
        //     return {
        //         id: x.id,
        //         label: x.label,
        //         source: x.source
        //     };
        // })

        // let filename = "export.json";
        // let contentType = "application/json;charset=utf-8;";
        // if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        //     var blob = new Blob([decodeURIComponent(encodeURI(JSON.stringify(dataForJson)))], { type: contentType });
        //     navigator.msSaveOrOpenBlob(blob, filename);
        // } else {
        //     var a = document.createElement('a');
        //     a.download = filename;
        //     a.href = 'data:' + contentType + ',' + encodeURIComponent(JSON.stringify(dataForJson));
        //     a.target = '_blank';
        //     document.body.appendChild(a);
        //     a.click();
        //     document.body.removeChild(a);
        // }
    }

    render() {
        const style = {
            display: 'relative',
            ...this.props.style
        };

        return <div className="dataMap">
            <div ref="container" id="containerForMap" style={style} >

                <h3 className="Title">
                    Related countries:
                </h3>

            </div>
            <Row className="Datamap-info">
                <Col>
                    <i><span className="areaColor"></span> Area</i>
                    <i><span className="countryColor"></span> Country</i>
                </Col>
            </Row>
            <Row>
                <Col className="download-button">
                    <Button variant="primary" onClick={this.handleDownload}>
                        ⤓ Download
                    </Button>
                </Col>
            </Row>
        </div>
    }

}
