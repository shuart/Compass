
import { stellae } from "./vendor/stellae2.js";
import tweakpane from 'https://cdn.skypack.dev/tweakpane';

import { v4 as uuidv4 } from  'https://cdn.skypack.dev/uuid';

//const pane = new tweakpane.Pane();
console.log(stellae)
var graph = undefined

var Reports = {
    status:{
        frame:0,
        nodes:{}
    },
    json:""
}

var currentPropPane  = undefined
let id1= uuidv4()
let id2= uuidv4()
var data = {
    nodes:[
        {
            id:id1,
            uuid:id1,
            x:0,
            y:0,
            name:"test",
            customColor:"#f27506",
            properties: {
                name: "test",
                type:"variable",
                value:5,
                function:"",
            }
        },
        {
            id:id2,
            uuid:id2,
            x:10,
            y:10,
            name:"tesst",
            customColor:"#f27506",
            properties: {
                name: "tesst",
                type:"variable",
                value:15,
                function:"",
            }
        }
    ],
    relationships:[],
    notes:[],
    groups:[]
}

start()

function updatePropPane(node){
    if(currentPropPane){
        currentPropPane.remove
    }

    // const PARAMS = {
    //     id: node.id,
    //     value: node.properties.value,
    //   };

    let PARAMS = node.properties

    currentPropPane= new tweakpane.Pane();
    currentPropPane.addInput(node, 'id');
    currentPropPane.addInput(node.properties, 'name');
    currentPropPane.addInput(node.properties, 'type');
    currentPropPane.addInput(node.properties, 'value');
    currentPropPane.addInput(node.properties, 'function');

    currentPropPane.addMonitor(Reports   , 'json', {
        multiline: true,
        lineCount: 5,
      });
    
    currentPropPane.on('change', (ev) => {
        console.log(data);
        saveTree(data)
    });
    const btn = currentPropPane.addButton({
        title: 'execute',
        label: 'counter',   // optional
      });

    
      
    let count = 0;
    btn.on('click', () => {
        count += 1;
        console.log(count);

        //var theInstructions = "alert('Hello World'); var x = 100";
        var theInstructions = "return " + "15*8";

        

        function createFunction1() {
            
            return new Function ("nodes","return " + PARAMS.function);
        }

        var F=createFunction1()
        var result = F(vars)
        alert(result)
        console.log(data)
        //return(F());
    });
    const btnAddVariable = currentPropPane.addButton({
        title: 'Add Variable',
        label: 'counter',   // optional
    });
    btnAddVariable.on('click', () => {
        addVariableNode()
    });

    const btnStock = currentPropPane.addButton({
        title: 'Add Stock',
        label: 'counter',   // optional
    });
    btnStock.on('click', () => {
        addStockNode()
    });

    const btnFlux = currentPropPane.addButton({
        title: 'Add Flux',
        label: 'counter',   // optional
    });
    btnFlux.on('click', () => {
        addFluxNode()
    });

    const btnSimulate = currentPropPane.addButton({
        title: 'Simulate',
        label: 'counter',   // optional
    });
    btnSimulate.on('click', () => {
        startSimulation()
    });
    const btnClearData = currentPropPane.addButton({
        title: 'clear local data',
        label: 'counter',   // optional
    });
    btnClearData.on('click', () => {
        deleteLocalData()
    });

    
}

function startSimulation() {
    let orderedGraph = topologicalOrdering(JSON.parse(JSON.stringify(data)))
    var speed =1000
    Reports.status.frame =0 
    
    step()
    
    function step() {
        console.log(Reports.status.frame)
        Reports.status.frame++
        Reports.status.nodes = reportNodeStatus(orderedGraph)
        Reports.json = JSON.stringify(Reports.status, null, 2)
        setTimeout(step, speed)
        
    }
    
}

function reportNodeStatus(orderedGraph) {
    resolveNodes(orderedGraph)
    var dataContainer = {}
    orderedGraph.orderedNodes.forEach(element => {
        dataContainer[element.id] = {name:element.name, value:element.properties.value }
    });
    return dataContainer
}

function resolveNodes(orderedGraph) {
    orderedGraph.orderedNodes.forEach(element => {
        element.properties.value = executeNodeFunction(orderedGraph.orderedNodes, element, orderedGraph.parentsList[element.id], orderedGraph.adgencyList[element.id])
        if (element.properties.type == "flux") { //if node is a flux update nearby stocks
            updateNearbyStocks(orderedGraph.orderedNodes, element,orderedGraph.parentsList[element.id], orderedGraph.adgencyList[element.id])
        }
    });
}

function executeNodeFunction(nodes, node, parents, children) {
    if (node.properties.type == "variable" || node.properties.type == "flux") {
        if ( node.properties.function != "") {
            var vars={}
            parents.forEach(element => {
                var parentNode = nodes.find(n=> n.id == element)
                vars[ ""+parentNode.name+""]=parentNode.properties.value
            });
            var $={
                time:Reports.status.frame
            }
            console.log(node.id, vars);
            function createFunction1() {
                
                return new Function ("nodes,$","return " + node.properties.function);
            }
        
            var F=createFunction1()
            var result = F(vars,$)
            return result
        }else{
            return  node.properties.value
        }
    } 
    if (node.properties.type == "stock") {
        return  node.properties.value
    }  
}

function updateNearbyStocks(nodes, node, parents, children) {
    //check parents first
    parents.forEach(element => {
        var parentNode = nodes.find(n=> n.id == element)
        if (parentNode.properties.type == "stock") {
            parentNode.properties.value -= node.properties.value
        }
    });
    children.forEach(element => {
        var childrenNode = nodes.find(n=> n.id == element)
        if (childrenNode.properties.type == "stock") {
            childrenNode.properties.value += node.properties.value
        }
    });
    
}

function addVariableNode() {
    var name = prompt("node name")
    let newId = uuidv4()
    data.nodes.push(
        {
            id:newId,
            uuid:newId,
            x:0,
            y:0,
            name:name,
            customColor:"#f27506",
            properties: {
                type:"variable",
                name: name,
                value:5,
                function:"",
            }
        }
    )
    update()
}

function addStockNode() {
    var name = prompt("node name")
    let newId = uuidv4()
    data.nodes.push(
        {
            id:newId,
            uuid:newId,
            x:0,
            y:0,
            name:name,
            customColor:"#089bc3",
            properties: {
                type:"stock",
                name: name,
                value:5,
                function:"",
            }
        }
    )
    update()
}

function addFluxNode() {
    var name = prompt("node name")
    let newId = uuidv4()
    data.nodes.push(
        {
            id:newId,
            uuid:newId,
            x:0,
            y:0,
            name:name,
            customColor:"#ba4bca",
            properties: {
                type:"flux",
                name: name,
                value:5,
                function:"",
            }
        }
    )
    update()
}




// function update(){
//     //graph.cleanAll()
//     graph.updateWithD3Data(data)
// }

async function linkNodes(node1, node2){
    //data.nodes = []
    data.relationships.push(
        {
            id:uuidv4(),
            startNode:node1.id,
            endNode:node2.id,
            source:node1.id,
            target:node2.id
        }
    )
    
}

function start() {
    data = reloadTree() || data
    if (data.nodesPositions) {
        data.nodesPositions.forEach(f =>{
            var match = data.nodes.find(c => c.uuid == f.uuid)
            if (match) {
              match.fx =f.fx ; match.x =f.fx;
              match.fy=f.fy; match.y =f.fy;
            }
          })
    }
    console.log(reloadTree() );
    render()
    
}

function update() {
    data.nodesPositions = graph.exportNodesPosition()
    saveTree(data)
    //console.log(graph.exportNodesPosition())
    render()
}
function render(){
    document.querySelector(".graph").innerHTML=""
    graph = new stellae(".graph",{
        onLinkingEnd :async function (e) {
            console.log(e);
            await linkNodes(e[0],e[1])

            console.log("save tree",graph.exportNodesPosition());
            data.nodesPositions = graph.exportNodesPosition()
            saveTree(data)
            update()
          },
          onNodeClick:function (node,eventData) {
            console.log(node,eventData)
            updatePropPane(data.nodes.find(n=>n.uuid == node.uuid))
            
          },
          onNodeDragEnd:function (node,eventData) {
              console.log("save tree",graph.exportNodesPosition());
            data.nodesPositions = graph.exportNodesPosition()
            saveTree(data)
            
          },
    })
    graph.updateWithD3Data(JSON.parse(JSON.stringify(data)))
}

function saveTree(data) {
    window.localStorage.setItem('lastTree', JSON.stringify(data));
}
function reloadTree() {
    const tree = window.localStorage.getItem('lastTree');
    return JSON.parse(tree)
}
function deleteLocalData() {
    window.localStorage.clear();
}

//HELPERS

function topologicalOrdering(data) {
    let adgencyList = createAdgencyList(data);
    let parentsList = createParentsList(data);
    let order = dfsTopSort(data, adgencyList);
    console.log(order)
    let ordered = data.nodes.sort((a,b)=>{
        return order[a.id]>order[b.id]
    })
    console.log(ordered)
    return {
        orderedNodes:ordered,
        order:order,
        adgencyList:adgencyList,
        parentsList:parentsList,
    }
    
    
    function createAdgencyList(data) {
        let adgencyList = {};
        data.nodes.forEach(element => {
            adgencyList[element.id]=[]
        });

        data.relationships.forEach(element => {
            console.log(adgencyList,element.source)
            adgencyList[element.startNode].push(element.endNode)
        });
        return adgencyList
    }
    function createParentsList(data) {
        let parentsList = {};
        data.nodes.forEach(element => {
            parentsList[element.id]=[]
        });

        data.relationships.forEach(element => {
            console.log(adgencyList,element.source)
            parentsList[element.endNode].push(element.startNode)
        });
        return parentsList
    }
    function dfsTopSortHelper(v, n, visited, topNums, adjacencyList) {
        visited[v] = true;
        const neighbors = adjacencyList[v];
        for (const neighbor of neighbors) {
            if (!visited[neighbor]) {
                n = dfsTopSortHelper(neighbor, n, visited, topNums,adjacencyList);
            }
        }
        topNums[v] = n;
        return n - 1;
    }

    function dfsTopSort(data, adgencyList) {
        const vertices = Object.keys(adgencyList);
        const visited = {};
        const topNums = {};
        let n = vertices.length - 1;
        for (const v of vertices) {
            if (!visited[v]) {
                n = dfsTopSortHelper(v, n, visited, topNums, adgencyList)
            }
        }
        return topNums;
    }
    
    //console.log(dfsTopSort(graph));
}




// var dataToD3Format = function (data) {
//     var count =0
//     return {
//       nodes : data.nodes.map((e) => {
//         e.id=e.uuid;
//         e.properties= {
//                 name: e.name + " " + (e.lastName || ""),
//             }
//         return e
//       }),
//       relationships : data.relationships
//         .filter(e=>{
//           var foundSourceNodeToConnect = data.nodes.find(i=>i.uuid == e.source)
//           var foundTargetNodeToConnect = data.nodes.find(i=>i.uuid == e.target)
//           return (foundSourceNodeToConnect && foundTargetNodeToConnect)
//         })
//         .map((e) => {
//           e.id=count++;
//           e.startNode = e.source;
//           e.endNode=e.target;
//           e.properties= {
//                   from: 1470002400000
//               }
//           return e
//         }),
//       notes: data.notes.map((e) => {
//         e.id=e.uuid;
//         return e
//       }),
//       groups: data.groups.map((e) => {
//         e.id=e.uuid;
//         return e
//       }),
//     }
//   }
