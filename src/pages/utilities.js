import axios from 'axios';


    function findContext(data, key) {
        var filtered = data.filter(x => { return x['url'] === key });
        return filtered
    }

    export async function handleUploadFile (event){
        this.setState({ isLoading: true, error: '' });
        const data = new FormData();
        data.append('file', event.target.files[0]);

        try {
            const text = await axios.post('http://127.0.0.1:5000/api', data, {

                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (text.status !== 200 && text.status !== 201) {
                throw new Error('Failed!');
            }
            console.log("TEKST Z PLIKU")
            console.log(text)
            this.processText(text);
        } catch (error) {
            this.setState({ contentLoaded: false, isLoading: false, error: "Something went wrong try again!" });
        }

    }

    export async function handleUrlFile(url) {
        this.setState({ isLoading: true, error: '' });
        try {
            const text = await axios.post('http://127.0.0.1:5000/apiURL', url, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (text.status !== 200 && text.status !== 201) {
                throw new Error('Failed!');
            }
            console.log("TEKST Z URL")
            console.log(text)
            this.processText(text);
        } catch (error) {
            this.setState({ contentLoaded: false, isLoading: false, error: "Something went wrong try again!" });
        }
    }

    export async function processText(text) {
        try {
            const jsonText = await axios.post('http://127.0.0.1:5001/api', {
                text: text.data,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (jsonText.status !== 200 && jsonText.status !== 201) {
                throw new Error('Failed!');
            }
            console.log('Json z spacy')
            console.log(jsonText)
            this.setState({ plainText: jsonText['data']['clean_text'] })
            const conceptsResponse = [];

            
            for (var key in jsonText['data']['concepts']) {
                let context = findContext(jsonText['data']['matches'], key)
                conceptsResponse.push({
                    id: key,
                    label: jsonText['data']['concepts'][key]['label'],
                    source: jsonText['data']['concepts'][key]['source'],
                    weight: jsonText['data']['concepts'][key]['weight'],
                    context: context
                })
            }
            

            conceptsResponse.sort((x, y) => y.weight - x.weight);

            this.setState({ concepts: conceptsResponse })


            const match = jsonText['data']['matches'].map(function (x) {
                return {
                    "url": x['url'],
                    "weight": 1
                }
            });

            const linkedDataResponse = await axios.post('http://127.0.0.1:5002/api', match);
            if (linkedDataResponse.status !== 200 && linkedDataResponse.status !== 201) {
                throw new Error('Failed!');
            }

            const linkedConcepts = [];

            console.log("linkedDataResponse")
            console.log(linkedDataResponse)

            for (var key in linkedDataResponse['data']) {
                linkedConcepts.push({
                    id: key,
                    type: linkedDataResponse['data'][key]['type'],
                    label: linkedDataResponse['data'][key]['label'],
                    concept: linkedDataResponse['data'][key]['concept']
                })
            }

            console.log("linkedConcepts")
            console.log(linkedConcepts)

            this.setState({ linkedData: linkedConcepts, contentLoaded: true, isLoading: false });

        } catch (error) {
            this.setState({ contentLoaded: false, isLoading: false, error: "Something went wrong try again!" });
        }


    }