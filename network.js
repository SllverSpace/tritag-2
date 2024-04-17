
var ws
var connected = false

var data = {}
var playerData = {}
var id = 0

var vid = ""
var vidLoaded = localStorage.getItem("id")
var letters = "abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRS0123456789"
if (vidLoaded) {
	vid = vidLoaded
} else {
	for (let i = 0; i < 8; i++) {
		vid += letters[Math.round(Math.random()*(letters.length-1))]
	}
	localStorage.setItem("id", vid)
}

function getViews() {
	ws.send(JSON.stringify({getViews: true}))
}

function sendMsg(sendData, bypass=false) {
	if (ws.readyState == WebSocket.OPEN && (connected || bypass)) {
		ws.send(JSON.stringify(sendData))
	}
}

var wConnect = false

function connectToServer() {
    console.log("Connecting...")
    if (ws) {
        if (ws.readyState == WebSocket.OPEN) {
			ws.close()
		}
    }
    connected = false
    id = 0
    ws = new WebSocket("wss://server.silverspace.online:443")

    ws.addEventListener("open", (event) => {
        sendMsg({connect: "tritag-2"}, true)
    })

    ws.addEventListener("message", (event) => {
        let msg = JSON.parse(event.data)
        if ("connected" in msg) {
            console.log("Connected!")
            connected = true
            id = msg.connected
            sendMsg({view: vid})
            data = {}
            sendData()
        }
        if ("ping" in msg && !document.hidden) {
            sendMsg({ping: true})
        }
        if ("views" in msg) {
            console.log(JSON.stringify(msg.views))
        }
        if ("data" in msg) {
            for (let player in msg.data) {
                if (!(player in playerData)) {
                    playerData[player] = msg.data[player]
                }
            }
            for (let player in playerData) {
                if (!(player in msg.data)) {
                    delete playerData[player]
                } else {
                    playerData[player] = {...playerData[player], ...msg.data[player]}
                }
            }
            for (let player in playerData) {
                if ("frames" in playerData[player]) {
                    playerData[player].framesA = playerData[player].frames.length
                    playerData[player].framesT = 0
                }
                if (player in players) {
                    players[player].lx2 = players[player].x
                    players[player].ly2 = players[player].y
                    players[player].langle2 = players[player].angle
                    players[player].lflips2 = players[player].flips
                    players[player].lflipping = players[player].flipping
                    players[player].lrotated = players[player].rotated

                    players[player].lastu = time
                }
            }
        }
    })

    ws.addEventListener("close", (event) => {
        console.log("Disconnected")
        wConnect = true
    })
}

connectToServer()

function sendData() {
    // console.log("sending data", new Date().getTime())
    let oldData = data
    data = {
        x: Math.round(player.x*100)/100,
        y: Math.round(player.y*100)/100,
        angle: player.angle,
        username: username,
        flips: player.flips,
        dashing: player.dashing,
        shifting: player.shifting,
        flipping: player.flipping,
        rotated: player.rotated,
        colour: player.colour
    }
    let newData = {}
    for (let key in data) {
        if (data[key] != oldData[key]) {
            newData[key] = data[key]
        }
    }
    sendMsg({data: newData})
}