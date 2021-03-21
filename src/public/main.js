const io = window.io;
(()=>{
  const socket = io();
  socket.on('connect', ()=>{
    getExamplesPaths().then(examples=>{
      examples.forEach((example)=>{
        const a = document.createElement('a');
        a.innerHTML = example.dirName;
        a.href='/'+example.dirName;
        document.body.appendChild(a);
      })
    });
  })

  /**
   * 
   * @returns {Promise.<string[]>}
   */
  function getExamplesPaths(){
    const promise = new Promise((resolve, reject)=>{
      socket.emit('client-get-examples');
      socket.once('client-get-examples', (examples)=>{
        resolve(examples);
      })
    })
    return promise;
  }
  socket.on('error', (error)=>{
    const pre = document.createElement('pre');
    document.body.innerHTML = '';
    document.body.appendChild(pre);
    pre.innerHTML = error.message;
  });


})();