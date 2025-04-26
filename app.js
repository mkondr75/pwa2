window.addEventListener('load', async () => {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('sw.js')
      console.log('Service worker register success', reg)
    } catch (e) {
      console.log('Service worker register fail')
    }
  }
  await loadPosts()

  var dataPoints = [];
  var y = 1000;
  var limit = 500;//50000

  for (var i = 0; i < limit; i++) {
    y += Math.round(10 + Math.random() * (-10 - 10));
    dataPoints.push({ y: y });
    //console.log("MAX6: i=" + i + "\n")
  }

  var chart = new CanvasJS.Chart("chartContainer", {
    animationEnabled: true,
    zoomEnabled: true,
    title: {
      text: "Performance Demo with 50,000 Data Points"
    },
    subtitles: [{
      text: "Try Zooming and Panning"
    }],
    data: [{
      type: "line",
      dataPoints: dataPoints
    }],
    axisY: {
      includeZero: false
    }
  });
  chart.render();

})


async function loadPosts() {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=3')
  const data = await res.json()

  const container = document.querySelector('#posts')
  container.innerHTML = data.map(toCard).join('\n')
}

function toCard(post) {
  return `
    <div class="card">
      <div class="card-title">
        ${post.title}
      </div>
      <div class="card-body">
        ${post.body}
      </div>
    </div>
  `
}
