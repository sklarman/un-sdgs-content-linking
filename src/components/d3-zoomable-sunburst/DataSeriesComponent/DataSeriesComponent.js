
import BootstrapTable from 'react-bootstrap-table-next';
import React, { Component } from "react";
import filterFactory, { selectFilter } from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';

import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import './DataSeriesComponent.scss'

class DataSeriesComponent extends Component {
  constructor(props) {
    super(props);
  }



  state = ({
  });


  render() {
    return (
      <div className="table-series">
        <h5>{this.props.description}</h5>
        {this.props.data['@graph'] ?
          <BootstrapTable keyField='id' data={this.props.data['@graph'].map((cube, index) => {
            let dataCodes = require('./dataCodes.json');
            let returnObject = {
              id: index,
              country: dataCodes["geoAreaCode"]["codes"][cube.geoAreaCode].label,
              value: cube[cube["measureType"]],
              unit: dataCodes["unitsCode"]["codes"][cube.unitMeasure].label,
              year: cube.yearCode,
            }
            // need to add dimentions
            let notRelevantFields = [
              "@id",
              "@type",
              "yearCode",
              "measureType",
              "unitMeasure",
              "geoAreaCode"
            ]

            for (let key in cube) {
              if (notRelevantFields.includes(key) || key === cube['measureType']) {
                continue;
              }
              console.log("new key !")
              console.log(key)
              console.log(dataCodes[key]["codes"][ cube[key] ].label)
              returnObject[key] =  cube[key]  ;
              notRelevantFields.push(key)

            }

            return returnObject;
          })} columns={this.props.columns} pagination={paginationFactory()} filter={filterFactory()} /> : <React.Fragment></React.Fragment>
        }
      </div>
    );
  }
}


export default DataSeriesComponent;

