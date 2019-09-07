var pk

fetch("assets/transactions/pk").then(data => {
  data.arrayBuffer().then(d => pk = d)
})
