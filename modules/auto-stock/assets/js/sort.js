let currentSort = null
let currentDirection = "asc"

function sortTable(key){

if(
!window.filteredData
||
!window.filteredData.length
)
return



if(
currentSort===key
){

currentDirection=

currentDirection==="asc"

?

"desc"

:

"asc"

}

else{

currentSort=key

currentDirection="asc"

}



const sorted=[

...window.filteredData

]



sorted.sort(

(a,b)=>{

let x=
a[key]

let y=
b[key]



if(
typeof x==="string"
){

x=
x
.toUpperCase()

y=
y
.toUpperCase()

}



x=
x??""

y=
y??""



if(
x>y
){

return currentDirection==="asc"
?1
:-1

}



if(
x<y
){

return currentDirection==="asc"
?-1
:1

}



return 0

}

)



window.filteredData=
sorted



drawTable(
sorted
)



updateSummary(
sorted
)



renderSort()

}





function getSortedRows(rows){

if(
!currentSort
)

return rows



return[...rows]

.sort(

(a,b)=>{

let x=
a[currentSort]

let y=
b[currentSort]



if(
typeof x==="string"
){

x=
x.toUpperCase()

y=
y.toUpperCase()

}



x=
x??""

y=
y??""



if(
x>y
){

return currentDirection==="asc"
?1
:-1

}



if(
x<y
){

return currentDirection==="asc"
?-1
:1

}



return 0

}

)

}





function renderSort(){

document

.querySelectorAll(
"thead th"
)

.forEach(

th=>{


const label=

th.dataset.label

||

th.dataset.key



if(
!label
)

return



th.innerText=
label



if(

th.dataset.key===currentSort

){

th.innerText+=

currentDirection==="asc"

?

" ↑"

:

" ↓"

}



}

)

}