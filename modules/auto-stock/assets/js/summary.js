function renderStatusSummary(rows){

    const statuses=[
    
    "10%",
    "20%",
    "30%",
    "40%",
    "50%",
    "70%",
    "80%",
    "90%",
    "normal",
    "freefall"
    
    ]
    
    
    
    const cats=[
    
    "ACCESSORIES",
    
    "APPAREL",
    
    "BAGS",
    
    "FOOTWEAR",
    
    "NON-MD"
    
    ]
    
    
    
    let html=`
    
    <div class="status-grid">
    
    <table>
    
    <thead>
    
    <tr>
    
    <th>
    
    CTR
    
    </th>
    
    ${statuses
    .map(
    x=>
    
    `<th>${x}</th>`
    
    )
    
    .join("")}
    
    </tr>
    
    </thead>
    
    <tbody>
    
    `
    
    
    
    cats.forEach(
    
    cat=>{
    
    html+=`
    
    <tr>
    
    <td>
    
    ${cat}
    
    </td>
    
    `
    
    
    
    statuses.forEach(
    
    st=>{
    
    
    const value=
    
    rows
    
    .filter(
    
    r=>
    
    String(
    r.category
    )
    
    .toUpperCase()
    
    ===cat
    
    &&
    
    String(
    r.status
    )
    
    .toLowerCase()
    
    ===st
    
    )
    
    .reduce(
    
    (
    a,
    b
    )=>
    
    a+
    1,
    
    0
    
    )
    
    
    
    html+=`
    
    <td>
    
    ${value}
    
    </td>
    
    `
    
    
    
    }
    
    )
    
    
    
    html+=
    `</tr>`
    
    
    
    }
    
    )
    
    
    
    html+=`
    
    </tbody>
    
    </table>
    
    </div>
    
    `
    
    
    
    const target=
    
    document
    .getElementById(
    "statusSummary"
    )
    
    
    
    if(
    target
    )
    
    target.innerHTML=
    html
    
    }