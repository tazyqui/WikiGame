/*
 *      Project 3
 *    Bryant Arias
 *   Vicente Cortes
 *     Tan Nguyen
*/

/*
 *   Interface / Input Validation & Search Suggestions
*/

var mainPage = document.querySelector('.background');
var srcField = document.querySelector('#searchSource');
var tgtField = document.querySelector('#searchTarget');
var BFSbutton = document.querySelector('#BFSbutton.button');
var BDSbutton = document.querySelector('#BDSbutton.button');
var resetBtn = document.querySelector('#playAgainBtn');
var loading = document.querySelector('.loadingScreen');
var results = document.querySelector('.results');
var executionTime = 0;

// Creating list elements using results from api search
function searchSuggestions (results, autocom) {
    if (!results || !results.length) {
        autocom.innerHTML = '';
        autocom.classList.add('hide');
    }
    else {
        let suggestions = results.map((item) => {
            return  `<li>${item}</li>`;
        })
        .join('');

        autocom.innerHTML = `<ul>${suggestions}</ul>`;
        autocom.firstChild.style.padding = "20px 15px 15px 15px";
        autocom.classList.remove('hide');
    }
}

// Checking whether the input string matches a real wikipedia page
function setValidationIcon (results, search) {
    let icon = search.nextElementSibling.nextElementSibling;

    if (results) {
        if (results[0].toLowerCase().trim() == search.value.toLowerCase().trim()) {
            icon.firstChild.classList.remove('fa-times');
            icon.firstChild.classList.add('fa-check');
        } else {
            icon.firstChild.classList.remove('fa-check');
            icon.firstChild.classList.add('fa-times');
        }
    } else {
        icon.firstChild.classList.remove('fa-check');
        icon.firstChild.classList.add('fa-times');
    }

}

// Returns errors if there are any invalid inputs or pages are the same
const validInputs = () => {
    var sourceIcon = document.querySelector('#srcValidIcon.icon').firstChild.classList.contains('fa-check');
    var targetIcon = document.querySelector('#tgtValidIcon.icon').firstChild.classList.contains('fa-check');
    var samePage = (srcField.value.trim() == tgtField.value.trim());

    if (sourceIcon && targetIcon && !samePage) {
        return true;
    } else {
        if (!sourceIcon && ! targetIcon) {
            alert("Both your start page and your target page are not valid Wikipedia pages");
        } else if (!sourceIcon) {
            alert("Your start page is not a valid Wikipedia page");
        } else if (!targetIcon) {
            alert("Your target page is not a valid Wikipedia page");
        } else if (samePage) {
            alert("Your start page and your target page must be different");
        }
        return false;
    }

}

// This runs every time the value in the search field changes
const inputChanged = async (evt) => {
    var searchResults = await wikipediaAPI.search(evt.target.value.trim(), 5);
    searchSuggestions(searchResults, evt.target.nextElementSibling);
    setValidationIcon(searchResults, evt.target);
}

// Hides the search suggestion box when the field is inactive or empty
function hideSearchSuggestions() {
    if ( srcField === document.activeElement && srcField.value != '') {
        srcField.nextElementSibling.classList.remove('hide');
    } else {
        srcField.nextElementSibling.classList.add('hide');
    }
    if ( tgtField === document.activeElement && tgtField.value != '') {
        tgtField.nextElementSibling.classList.remove('hide');
    } else {
        tgtField.nextElementSibling.classList.add('hide');
    }
}

// Event listeners to trigger hidesearchsuggestions
document.addEventListener('focusin', function () { hideSearchSuggestions() })
document.addEventListener('focusout', function () { hideSearchSuggestions() })

// Event listeners for input fields
srcField.addEventListener('input', inputChanged);
tgtField.addEventListener('input', inputChanged);

// Call BFS method when its button is clicked and change to results page
BFSbutton.addEventListener('click', 
    async function () {
        if (validInputs()) {
            console.log('Running breadth first search...')
            mainPage.classList.add('hide');
            loading.classList.remove('hide');
            t0 = performance.now();
            let path = await BFS(srcField.value.trim(), tgtField.value.trim());
            t1 = performance.now();
            executionTime = ((t1-t0) / 1000).toFixed(3);
            console.log("Execution time: " + ((t1-t0) / 1000).toFixed(3) + " seconds.");
            displayResults(path);
            loading.classList.add('hide');
            results.classList.remove('hide');
        }
    }
);

// Call BDS method when its button is clicked and change to results page
BDSbutton.addEventListener('click', 
    async function () {
        if (validInputs()) {
            console.log('Running bidirectional search...')
            mainPage.classList.add('hide');
            loading.classList.remove('hide');
            var t0 = performance.now();
            let path= await BDS(srcField.value.trim(), tgtField.value.trim()); 
            var t1 = performance.now();
            executionTime = ((t1-t0) / 1000).toFixed(3);
            console.log("Execution time: " + ((t1-t0) / 1000).toFixed(3) + " seconds.");
            displayResults(path);
            loading.classList.add('hide');
            results.classList.remove('hide');
        }
    }
);

// Event listener for play again button, reloads the site
resetBtn.addEventListener('click', function () {
    location.reload()
})


/*
 *   Setting Up Wikipedia API class and methods for data retrieval
*/

var wikipediaAPI;   // Instance of the wikipedia API


// Uses fetch API to fetch wiki links, backlinks, and search results
//constant time throughout
async function request(APIurl, params) {
    let url = APIurl + encodeParams(params);

    let response = await fetch(url);
    let results = await response.json();
    return results;
}

// Encodes the parameters apssed in to create url for fetch API
function encodeParams(params) {

    var encodedParams = '?origin=*';

    Object.keys(params).forEach(function(key) {
        if (params[key] === undefined || params[key] === null) return;
        encodedParams += '&' + encodeURI(key) + '=' + encodeURI(params[key]);
      });
    
      return encodedParams;
}

// Class to create wikipediaAPI instance
class WikipediaAPI {
    // Hard coded host to english wikipedia
    // Can be changed to other mediaWiki servers
    constructor () {
        this.url = "https://en.wikipedia.org/w/api.php";
    }

    // Method to search wiki using opensearch protocol
    // Takes in search string and maximum number of results to return
    // used for input suggestions & validation
    async search(page, resultLimit) {
        const response = await request(
            this.url,
            {
                action: "opensearch",
                format: "json",
                search: page,
                namespace: 0,
                limit: resultLimit
            }
        );
        return response[1]; //return the article titles specifically
    }

    // Returns at most 500 forward links contained on page
    // Used in getLinks()
    async getLinkBatch(page, cont) {
        const response = await request(
            this.url,
            {
                action: "query",
                format: "json",
                pllimit: "max",
                titles: page,
                prop: "links",
                plcontinue: cont
            }
        );
        return response;
    }

    // Returns at most 500 backlinks that point to target page
    // Used in get 
    async getBackLinkBatch(page, cont) {
        const response = await request(
            this.url,
            {
                action: "query",
                format: "json",
                bllimit: "max",
                list: "backlinks",
                bltitle: page,
                blcontinue: cont
            }
        );
        return response;
    }

    async getPageData(page) {
        const response = await request(
            this.url,
            {
                action: "query",
                prop: "pageimages|extracts&explaintext",
                exchars: 160,
                format: "json",
                titles: page
            }
        );
        return response;
    }

    // Returns all the links contained on a page
    // Uses getLinks function and API continue parameter
    //will run multiple request if we hit limit of 500 pages,
    // pages have usually less than 500 links, but stay in small range.
    //this does not change when there are more articles or more dense ones
    //reduces to constant time, which leaves our complexity at O(l)
    // or the amount of linkes per page
    async getLinks(title) {
        let moreLinks = true;
        let cont = '||';
        let links = [];

        while (moreLinks){
            var data;

            data = await this.getLinkBatch(title, cont)

            if(data['continue'] == undefined) {
                moreLinks = false;
            } else {
                cont = data['continue']['plcontinue'];
            }
            if (data.query == undefined) {
                return links
            } else {
                let pageID = Object.keys(data.query.pages)[0];
                var linkBatch = data.query.pages[pageID].links;
            }
            if (linkBatch == undefined){
                return links;
            }

            for (let i = 0; i < linkBatch.length; i++){
                links.push(linkBatch[i]['title']);
            }
        }
        return links;
    }

    // Returns all the pages which point to a specific page
    // Uses getBackLinks function and API continue parameter
    async getBackLinks(title) {
        let moreLinks = true;
        let cont;
        let backlinks = [];

        while (moreLinks){
            var data;

            data = await this.getBackLinkBatch(title, cont);

            if(data['continue'] == undefined) {
                moreLinks = false;
            } else {
                cont = data['continue']['blcontinue'];
            }
            if (data.query == undefined) {
                return backlinks;
            } else {
                var linkBatch = data.query.backlinks;
            }
            if (linkBatch == undefined){
                return backlinks;
            }

            for (let i = 0; i < linkBatch.length; i++){
                backlinks.push(linkBatch[i]['title']);
            }
        }
        return backlinks;
    }


};

// Instantiate wikipediaAPI object if not already
function setupAPI() {
  if (!wikipediaAPI) {
    wikipediaAPI = new WikipediaAPI();
  }
}
setupAPI();


/*
 *    Queue Class Used in both searches - GeeksForGeeks used for reference
*/ 

class Queue {
    // Array is used to implement a Queue
    constructor() {
      this.items = [];
    }
    
    // adding element to the queue
    enqueue(element) {
      this.items.push(element);
    }

    // removing element from the queue
    // returns underflow when called on empty queue
    dequeue() {
      
      if (this.isEmpty()) return "Underflow";
      return this.items.shift();
    }

    // returns the Front element of the queue without removing it
    front() {
      
      if (this.isEmpty()) return "No elements in Queue";
      return this.items[0];
    }

    // return true if the queue is empty
    isEmpty() {
      return this.items.length == 0;
    }
}
//Queue class implemented with use of arrays
//all functions are O(1) time,
class Queue2
{
    
    constructor(){
        this.elem = [];
        this.pointer = 0;
    }

    push (page)
    {
        this.elem.push(page);
    }

    front()
    {
        return this.elem[this.pointer];
    }

    pop ()
    {
        this.pointer++;
    }

    isEmpty ()
    {
        return this.elem.length < this.pointer;
    }
}

/*
 *    Breadth First Search Implementation
*/

//this function takes in two strings and perfroms
//BFS with thsoe two as source and destination
//further explanations of complexities embedded in
//Code snippets below: O(n^2*l + n) or O(n*l) worst/avg case or best
//O(n*l), where links are expected to be much smaller than l
async function BFS(src,dst){
    
    //Code snippets below: O(1)
    const visited = new Map();
    const parents = new Map();

    var q = new Queue2();

    //Code snippets below: vary, assume map functions are constant in best case
    // and O(n) in average and worst
    q.push(src);
    visited.set(src,true);


    let whilecont = true;

   //while loop breaks when we find path or we exhaust articles
    ////While loop potentially loops through all articles in queue O(n)
    while (whilecont){

        //complexity O(1)
        let u = q.front();
        q.pop();
        if (q.isEmpty()){
            whilecont = false;
        }

        let adj = [];
        //complexity O(l)
        adj = await wikipediaAPI.getLinks(u);
        let size = adj.length;

        //looking through links, O(l * inside)
        for (let i = 0; i < size; i++)
        {
            //everything in the if cases has O(1) complexity in best case
            //and O(n) in worst case as per the look ups
            //O(n) time will be used in most cases, as O(n) is present when pages don't exist, and we are always adding new pages
            //and usually pages link to many more new pages
            let page = adj[i];
            if (page.toLowerCase() == dst.toLowerCase()){
                dst = page;
                parents.set(dst, u);
                whilecont = false;
                visited.set(dst, true);
                break;
            }
            else if (!visited.has(page)) {
                q.push(page);
                visited.set(page,true);
            }

            if (!parents.has(page)){
                parents.set(page, u);
            }
        }
    }
    
    //path could be total articles, but since we look
    //specifically for shortestpath => path <<< n pages
    // all below are O(1) through reduction
    let path = [];
    path.push(dst);
    let parent = parents.get(dst);

    while (parent != src || parent == undefined){
        path.push(parent);
        parent = parents.get(parent);
    }

    path.push(src); 

    return path.reverse();
}

/*
 *    Bidirectional Search Implementation - GeeksForGeeks used as reference
*/

async function BDS(src, tgt) {

    src = src.toLowerCase();
    tgt = tgt.toLowerCase();
  let s_visited = {};
  let s_q = new Queue();
  let s_parent = {};

  let t_visited = {};
  let t_q = new Queue();
  let t_parent = {};  

  s_visited[src] = true;
  s_q.enqueue(src);
  s_parent[src] = -1;

  t_visited[tgt] = true;
  t_q.enqueue(tgt);
  t_parent[tgt] = -1;

  let intersectNode = -1;
  let intersectNodeFound = false;

  while (!s_q.isEmpty() && !t_q.isEmpty()) {
    let s_currentElement = s_q.dequeue();
    let s_get_List = await wikipediaAPI.getLinks(s_currentElement);

    let t_currentElement = t_q.dequeue();
    let t_get_List = await wikipediaAPI.getBackLinks(t_currentElement);
    if (!intersectNodeFound && s_get_List != []) {
      for (let i in s_get_List) {
        let neigh = s_get_List[i];
        neigh = neigh.toLowerCase();
        if (!s_visited[neigh]) {
          s_visited[neigh] = true;
          s_parent[neigh] = s_currentElement;
          s_q.enqueue(neigh);
        }
        if (t_visited[neigh]) {
          intersectNode = neigh;
          intersectNodeFound = true;
         
          break;
        }
      }
    }

    if (!intersectNodeFound && t_get_List != []) {
      for (let i in t_get_List) {
        let neigh = t_get_List[i];
        neigh = neigh.toLowerCase();
        if (!t_visited[neigh]) {
          t_visited[neigh] = true;
          t_parent[neigh] = t_currentElement;
          t_q.enqueue(neigh);
        }
        if (s_visited[neigh]) {
          intersectNode = neigh;
          intersectNodeFound = true;
          break;
        }
      }
    }

    if (intersectNodeFound) {
      //print path
      let path = [];
      path.push(intersectNode);
      let i = intersectNode;
      while (i != src) {
        path.unshift(s_parent[i]);
        i = s_parent[i];
      }

      i = intersectNode;
      while (i != tgt) {
        path.push(t_parent[i]);
        i = t_parent[i];
      }

      //return path in console;
      return path;   
    }
  }
}


/*
 *    Creating Result Items - Referenced Traversy Media Search App Youtube video
*/ 

const displayResults = async (path) => {
    // Get page data for search results
    var resultArray = [];
    await Promise.all(path.map(async titles => {
        const rawResults = await wikipediaAPI.getPageData(titles);
        let pageID = Object.keys(rawResults.query.pages)[0];
        resultArray.push(rawResults.query.pages[pageID]);
    }))
    // Result array is in order of resolved promises
    // Must reorganize the results to match the path order
    buildSearchResults(reorganizeResults(resultArray, path));
}


const buildSearchResults = (resultArray) => {
    const searchResults = document.querySelector('.searchResults');
    const line = document.createElement('div');
    line.classList.add('line');
    searchResults.append(line);
    resultArray.forEach(result => {
        const resultContents = document.createElement('div');
        resultContents.classList.add('resultContents');
        const resultItem = createResultItem(result, resultContents);
        const resultText = createResultText(result);
        resultContents.append(resultText)
        if (result.pageimage) {
            const resultImage = createResultImage(result);
            resultItem.append(resultImage);
        }
        ;
        resultItem.append(resultContents);
        const resultItemBox = document.createElement('div');
        resultItemBox.classList.add('resultItemBox');
        resultItemBox.append(resultItem);
        const link = document.createElement('a');
        link.href = `https://en.wikipedia.org/?curid=${result.pageid}`;
        link.target = '_blank';
        link.append(resultItemBox);
        searchResults.append(link);
    });
    const statText = document.querySelector('.timeElapsed');
    statText.textContent = `Finished in ${executionTime} seconds`;
}

const createResultItem = (result, resultContents) => {
    const resultItem = document.createElement('div');
    resultItem.classList.add('resultItem');
    const resultTitle = document.createElement('div');
    resultTitle.classList.add('resultTitle');
    resultTitle.textContent = result.title;
    resultContents.append(resultTitle);
    return resultItem;
}

const createResultImage = (result) => {
    const resultImage = document.createElement('div');
    resultImage.classList.add('resultImage');
    const img = document.createElement('img');
    img.src = result.thumbnail.source;
    img.alt = result.title;
    resultImage.append(img);
    return resultImage;
}

const createResultText = (result) => {
    const resultText = document.createElement('div');
    resultText.classList.add('resultText');
    const resultDescription = document.createElement('p');
    resultDescription.classList.add('resultDescription');
    resultDescription.textContent = result.extract;
    resultText.append(resultDescription);
    return resultText;
}

const reorganizeResults = (resultArray, path) => {
    let orderedArray = [];

    while(path.length > 0) {
        for (let i = 0; i < resultArray.length; i++){
            if (resultArray[i].title.toLowerCase() == path[0].toLowerCase()) {
                orderedArray.push(resultArray[i]);
                path.splice(0, 1);
                resultArray.splice(i, 1);
                break;
            } 
        }
    }
    console.log(orderedArray)
    return orderedArray;

}
