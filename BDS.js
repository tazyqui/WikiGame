// Queue class from GeeksForGeeks
class Queue {
  // Array is used to implement a Queue
  constructor() {
    this.items = [];
  }

  // enqueue function
  enqueue(element) {
    // adding element to the queue
    this.items.push(element);
  }

  // dequeue function
  dequeue() {
    // removing element from the queue
    // returns underflow when called
    // on empty queue
    if (this.isEmpty()) return "Underflow";
    return this.items.shift();
  }
  // front function
  front() {
    // returns the Front element of
    // the queue without removing it.
    if (this.isEmpty()) return "No elements in Queue";
    return this.items[0];
  }
  // isEmpty function
  isEmpty() {
    // return true if the queue is empty.
    return this.items.length == 0;
  }
}

//get an array of links from a page
async function getList(title) {
  let url =
    "https://en.wikipedia.org/w/api.php?&origin=*&action=query&format=json&prop=links&indexpageids=1&plnamespace=0&pllimit=500&titles=" + title;
  let links = [];
  let jsondata = await getJson(url);
  let pageID = jsondata["query"]["pageids"][0];

  while (true) {
    //return empty array if links are not found
    if (!jsondata["query"]["pages"][pageID].hasOwnProperty("links")) {
      return [];
    }
    
    //itterate through the links and push it onto an array
    let tempList = jsondata["query"]["pages"][pageID]["links"];
    for (let i = 0; i < tempList.length; i++) {
      links.push(tempList[i]["title"]);
    }

    //if there are more than 500 links, continue
    if (jsondata.hasOwnProperty("continue")) {
      let plcontinue = jsondata["continue"]["plcontinue"];
      jsondata = await getJson(url + "&plcontinue=" + plcontinue);
    } 
    else {
      break;
    }
  }

  //return array of links
  return links;
}

//get an array of links to a page
async function getListReverse(title) {
  let url =
    "https://en.wikipedia.org/w/api.php?&origin=*&action=query&format=json&prop=linkshere&indexpageids=1&lhprop=title&lhnamespace=0&lhlimit=500&titles=" +title;
  let links = [];
  let jsondata = await getJson(url);
  let pageID = jsondata["query"]["pageids"][0];

  while (true) {
    //return empty array if links are not found
    if (!jsondata["query"]["pages"][pageID].hasOwnProperty("linkshere")) {
      return [];
    }
    
    //itterate through the links and push it onto an array
    let tempList = jsondata["query"]["pages"][pageID]["linkshere"];
    for (let i = 0; i < tempList.length; i++) {
      links.push(tempList[i]["title"]);
    }

    //if there are more than 500 links, continue
    if (jsondata.hasOwnProperty("continue")) {
      let lhcontinue = jsondata["continue"]["lhcontinue"];
      jsondata = await getJson(url + "&lhcontinue=" + lhcontinue);
    } 
    else {
      break;
    }
  }

  //return array of links
  return links;
}

//function to get Json from url
async function getJson(url) {
  let response = await fetch(url);
  let data = await response.json();
  return data;
}

//bidirectional search algorithm, using GeeksForGeeks bidirectional search algorithm as reference.
async function bds() {
  let srcTitle = document.getElementById("input1").value;
  let targetTitle = document.getElementById("input2").value;

  let s_visited = {};
  let s_q = new Queue();
  let s_parent = {};

  let t_visited = {};
  let t_q = new Queue();
  let t_parent = {};  

  s_visited[srcTitle] = true;
  s_q.enqueue(srcTitle);
  s_parent[srcTitle] = -1;

  t_visited[targetTitle] = true;
  t_q.enqueue(targetTitle);
  t_parent[targetTitle] = -1;

  let intersectNode = -1;
  let intersectNodeFound = false;

  
  while (!s_q.isEmpty() && !t_q.isEmpty()) {
    let s_currentElement = s_q.dequeue();
    let s_get_List = await getList(s_currentElement);

    let t_currentElement = t_q.dequeue();
    let t_get_List = await getListReverse(t_currentElement);
    
    //search through the links of of the foward list
    if (!intersectNodeFound && s_get_List != []) {
      for (let i in s_get_List) {
        let neigh = s_get_List[i];
        if (!s_visited[neigh]) {
          s_visited[neigh] = true;
          s_parent[neigh] = s_currentElement;
          s_q.enqueue(neigh);
        }
        
        //break if intersect node is found
        if (t_visited[neigh]) {
          intersectNode = neigh;
          intersectNodeFound = true;
         
          break;
        }
      }
    }

    //search throught the links of the reverse list
    if (!intersectNodeFound && t_get_List != []) {
      for (let i in t_get_List) {
        let neigh = t_get_List[i];
        if (!t_visited[neigh]) {
          t_visited[neigh] = true;
          t_parent[neigh] = t_currentElement;
          t_q.enqueue(neigh);
        }
        
        //break if intersect node is found
        if (s_visited[neigh]) {
          intersectNode = neigh;
          intersectNodeFound = true;
          break;
        }
      }
    }

    //print path
    if (intersectNodeFound) {    
      let path = [];
      path.push(intersectNode);
      let i = intersectNode;
      while (i != srcTitle) {
        path.unshift(s_parent[i]);
        i = s_parent[i];
      }

      i = intersectNode;
      while (i != targetTitle) {
        path.push(t_parent[i]);
        i = t_parent[i];
      }

      //return path in console;
      return path;   
    }
  }
  
}


//function to call the bds algorithm and get execution time
async function getBDS() {
  console.log("Loading...");
  var t0 = performance.now();
  let out= await bds(); 
  console.log(out);
  var t1 = performance.now();
  console.log("Execution time: " + (t1-t0) + " milliseconds.");
}
