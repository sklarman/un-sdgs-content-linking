import axios from 'axios';
let config = require('../../config.json');

function findContext(data, key) {
    var filtered = data['matches'].filter(x => { return x['url'] === key });
    return filtered
}

const componentToHex = (c) => {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

const rgbToHex = (r, g, b) => {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

const handleCountryColors = (jsonText, dataForDataMap, dataForSeries) => {
    let altdataForSeries = [];
    let countryArr = jsonText.data.countries.total;
    let countryAreasData = require('./CountryAndArea.json');
    let countryAreas = countryAreasData.results.bindings.map(x => { return { id: x.id.value, code: x.member_country_code.value } });
    if (countryArr !== undefined) {
        let maxWeight = countryArr[jsonText.data.countries.top_country] ? countryArr[jsonText.data.countries.top_country].weight : undefined;
        let maxColorForCountry = {};
        let weightsForCountrys = {};
        let top_regions = jsonText.data.countries.top_regions;

        // selected areas
        for (let elem in jsonText.data.countries.top_regions) {
            if (countryArr[top_regions[elem]].source !== 'geo') {
                let temp = countryAreas.filter(x => x.id === countryArr[top_regions[elem]].url);
                for (let key in temp) {
                    if (weightsForCountrys[temp[key].code] === undefined) {
                        weightsForCountrys[temp[key].code] = 0;
                    }
                    weightsForCountrys[temp[key].code] = weightsForCountrys[temp[key].code] + countryArr[top_regions[elem]].weight;
                }
            }
        }

        let maxCountryWeight = 0;
        for (let key in weightsForCountrys) {
            if (maxCountryWeight < weightsForCountrys[key]) {
                maxCountryWeight = weightsForCountrys[key];
            }
        }
        // selected areas
        for (let key in weightsForCountrys) {

            let colorIntens = weightsForCountrys[key] / maxCountryWeight;

            if (maxColorForCountry[key] === undefined || maxColorForCountry[key] < colorIntens) {
                maxColorForCountry[key] = colorIntens;
                dataForDataMap[key] = {
                    fillColor: rgbToHex(
                        227 - Math.round(60 * colorIntens), // 227 - 60
                        227 - Math.round(30 * colorIntens),  // 227 - 30
                        227)
                };
            }
        }


        // selected country
        for (let elem in jsonText.data.countries.top_regions) {
            if (countryArr[top_regions[elem]].source === 'geo') {
                let countryInfo = countryArr[top_regions[elem]];
                let colorIntens = countryInfo.weight / maxWeight;
                dataForDataMap[countryInfo.name] = { fillColor: rgbToHex(255, Math.round(255 - 255 * colorIntens), Math.round(255 - 255 * colorIntens)) };
                dataForSeries.push(countryInfo.url);
            }
        }
    }

    if (dataForSeries.length === 0) {
        for (let code of altdataForSeries) {
            dataForSeries.push(codeToUri(code, countryAreasData)); // should be uri
        }
    }

}

function codeToUri(code, countryAreas) {
    let arr = countryAreas.results.bindings;
    for (let obj of arr) {
        if (obj.member_country_code.value === code) {
            return obj.member_country.value;
        }
    }
    return code
}

async function loadExample(storedData) {

    let dir = "./examples/" + storedData.id + "/data.json";
    let example = {};
    try {
        const json = await axios.post(config.textLinkApiUrlcashed, dir, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        if (json.status !== 200 && json.status !== 201) {
            throw new Error('Failed!');
        }
        // console.log(json)
        example = json.data;
    } catch (error) { 
        this.setState({ contentLoaded: false, isLoading: false, error: "There was a problem with the URL, please try again!", progress: 45, waitForData: true });
        return;
    }
    // console.log(example)
    // let example = json; 
    // let example = require("./examples/" + storedData.id + "/data.json");
    let jsonText = { data: example.spacy };

    // console.log(jsonText)
    let dataForDataMap = {};
    let dataForSeries = [];
    this.setState({ downloadDataAboutCountry: jsonText.data.countries.show_data })

    handleCountryColors(jsonText, dataForDataMap, dataForSeries);

    this.setState({ plainText: jsonText['data']['clean_text'], dataForDataMap: dataForDataMap, matchQuotesForCounty: jsonText.data.countries.matches, dataForSeries: dataForSeries, progress: 60 })
    const conceptsResponse = [];
    const conceptsResponseList = [];

    for (var obj of jsonText['data']['concepts']) {
        let context = findContext(jsonText['data'], obj.uri)
        conceptsResponse.push({
            id: obj.uri,
            label: obj['label'],
            source: obj["sources"],
            weight: obj['weight'],
            context: context,
        })
        conceptsResponseList.push({
            id: obj.uri,
            label: obj['label'],
            source: obj["sources"], //jsonText['data']['concepts'][key]['source'],
            weight: obj['weight'],
            context: context,
            open: false
        })
    }

    conceptsResponse.sort((x, y) => y.weight - x.weight);

    this.setState({ concepts: conceptsResponseList, fullConcepts: conceptsResponse, conceptsShowData: jsonText['data'].concepts_show_data })

    let linkedDataResponse = { data: example.query };

    await this.setState({ dataForSun: linkedDataResponse.data });

    await this.setState({ contentLoaded: true, isLoading: false, waitForData: false, progress: 0 });
}

export async function handleUploadFile(file) {
    this.setState({ progress: 10 })
    if (file === undefined) {
        this.setState({ contentLoaded: false, isLoading: false, error: "Something went wrong try again!" });
        this.setState({ waitForData: true });
    }
    this.setState({ isLoading: true, error: '', loadedFrom: file.name, fileName: file.name });
    const data = new FormData();
    data.append('file', file);

    try {
        const json = await axios.post(config.textApiUrl, data, {

            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        if (json.status !== 200 && json.status !== 201) {
            throw new Error('Failed!');
        }
        if (!["en", "es", "fr", "zh", "ar", "ru"].includes(json.data.lang)) {
            this.setState({ contentLoaded: false, isLoading: false, error: `This language ( ${json.data.lang} ) is not supported! Supported languages: Arabic, Chinese, English, French, Russian and Spanish.`, progress: 45, waitForData: true });
            this.setState({});
        }
        if (json.data.size === false) {
            this.setState({ contentLoaded: false, isLoading: false, error: `Uploaded document is too large.`, progress: 45, waitForData: true });
            this.setState({});
        }
        else {
            this.processText(json.data);
        }
    } catch (error) {
        this.setState({ contentLoaded: false, isLoading: false, error: "Something went wrong try again!", progress: 45, waitForData: true });
    }

}

export async function handleUrlFile(url) {

    this.setState({ isLoading: true, error: '', loadedFrom: url, progress: 10 });
    // check if example
    let tempArr = this.state.examples.filter(x => x.url === url);
    if (tempArr.length > 0) {

    this.setState({  progress: 50 });
        this.loadExample = loadExample.bind(this);
        this.loadExample(tempArr[0]);
        return;
    }
    try {
        const json = await axios.post(config.textLinkApiUrl, url, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        if (json.status !== 200 && json.status !== 201) {
            throw new Error('Failed!');
        }
        if (!["en", "es", "fr", "zh", "ar", "ru"].includes(json.data.lang)) {
            this.setState({ contentLoaded: false, isLoading: false, error: `This language ( ${json.data.lang} ) is not supported! Supported languages: Arabic, Chinese, English, French, Russian and Spanish.`, progress: 45, waitForData: true });
        }
        else {
            this.processText(json.data);
        }
    } catch (error) {
        this.setState({ contentLoaded: false, isLoading: false, error: "There was a problem with the URL, please try again!", progress: 45, waitForData: true });
    }
}

export async function processText(data) {
    try {

        const jsonText = await axios.post(config.spacyApiUrl, {
            text: data.text,
            lang: data.lang,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (jsonText.status !== 200 && jsonText.status !== 201) {
            throw new Error('Failed!');
        }
        // console.log('Json z spacy')
        // console.log(jsonText) 

        let dataForDataMap = {};
        let dataForSeries = [];
        this.setState({ downloadDataAboutCountry: jsonText.data.countries.show_data })

        handleCountryColors(jsonText, dataForDataMap, dataForSeries)
        // console.log("mapy")

        this.setState({ plainText: jsonText['data']['clean_text'], dataForDataMap: dataForDataMap, matchQuotesForCounty: jsonText.data.countries.matches, dataForSeries: dataForSeries, progress: 60 })
        const conceptsResponse = [];
        const conceptsResponseList = [];

        for (var obj of jsonText['data']['concepts']) {
            let context = findContext(jsonText['data'], obj.uri)
            conceptsResponse.push({
                id: obj.uri,
                label: obj['label'],
                source: obj["sources"], //jsonText['data']['concepts'][key]['source'],
                weight: obj['weight'],
                context: context,
            })
            conceptsResponseList.push({
                id: obj.uri,
                label: obj['label'],
                source: obj["sources"], //jsonText['data']['concepts'][key]['source'],
                weight: obj['weight'],
                context: context,
                open: false
            })
        }

        conceptsResponse.sort((x, y) => y.weight - x.weight);


        // console.log("conceptsResponse")
        // console.log(conceptsResponse)


        this.setState({ concepts: conceptsResponseList, fullConcepts: conceptsResponse, conceptsShowData: jsonText['data'].concepts_show_data })


        // data for graphQueryApiUrl
        const match = jsonText['data']['concepts'].map(function (x) {
            return {
                "uri": x['uri'],
                "weight": x.weight
            }
        });


        const linkedDataResponse = await axios.post(config.graphQueryApiUrl, match, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (linkedDataResponse.status !== 200 && linkedDataResponse.status !== 201) {
            throw new Error('Failed!');
        }

        // console.log("linkedDataResponse")
        // console.log(linkedDataResponse) 
        await this.setState({ dataForSun: linkedDataResponse.data });

        await this.setState({ contentLoaded: true, isLoading: false, waitForData: false, progress: 0 });

    } catch (error) {
        this.setState({ contentLoaded: false, isLoading: false, error: "Something went wrong try again!" });
        this.setState({ waitForData: true });
    }


}
