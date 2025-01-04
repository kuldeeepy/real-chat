<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'

const chatMessage = reactive({ messages: [] })

const newMessage = ref('')
const sessions = reactive([])
const chats = reactive([])
let socket = null
let toggle = ref(false)

const sendMessage = () => {
  if (newMessage.value.trim() === '') return
  socket.send(newMessage.value)
  chatMessage.messages.push({ username: 'User', text: newMessage.value, timestamp: Date.now() })
  newMessage.value = ''
}

const getAllSessions = async () => {
  const result = await fetch('http://localhost:3000/getAllConversations')
  const data = await result.json()
  sessions.splice(0, sessions.length, ...data)
}

const getAllChats = async (id) => {
  toggle.value = true
  const chatDoc = await fetch(`http://localhost:3000/getAllChats?sessionID=${id}`)
  const result = await chatDoc.json()
  // chatMessage.messages.splice(0, chatMessage.messages.length, ...result)
  chats.splice(0, chats.length, ...result)
}

onMounted(() => {
  getAllSessions()

  socket = new WebSocket('ws://localhost:2000')

  socket.onmessage = (e) => {
    const messageData = e.data

    if (
      chatMessage.messages.length > 0 &&
      chatMessage.messages[chatMessage.messages.length - 1].username === 'AI'
    ) {
      chatMessage.messages[chatMessage.messages.length - 1].text += messageData
    } else {
      chatMessage.messages.push({
        username: 'AI',
        text: messageData,
        timestamp: Date.now(),
      })
    }
  }

  socket.onerror = (error) => {
    console.error(`Error: ${error}`)
  }

  socket.onopen = () => console.log('ws connected:)')
  socket.onclose = () => console.log('ws disconnected:(')
})

onBeforeUnmount(() => (socket ? socket.close() : null))
</script>

<template>
  <div id="app" class="flex">
    <div id="sidebar" class="flex-[.3] h-screen border p-2 overflow-y-scroll">
      <h2 class="text-center my-4 font-semibold text-lg">History</h2>
      <div v-for="(session, idx) in sessions" :key="idx">
        <h3
          @click="getAllChats(session._id)"
          class="border my-2 p-3 text-sm rounded-lg active:bg-black active:text-white cursor-pointer"
        >
          {{ session._id }}
        </h3>
      </div>
    </div>
    <div class="p-3 md:mx-auto flex-1">
      <h2 class="my-6 text-center font-semibold text-2xl">Chat App</h2>

      <div
        v-if="chatMessage.messages.length"
        class="chat-window border-2 p-4 font-normal font-sans text-sm md:text-base rounded-lg h-[80vh] overflow-y-scroll"
      >
        <div v-for="(message, idx) in chatMessage.messages" :key="idx">
          <div v-if="message.username == 'AI'">
            <p
              class="bg-black text-white bg-opacity-[.8] rounded-r-2xl rounded-t-2xl p-3 my-4 w-fit"
            >
              {{ message.text }}
            </p>
            <em class="text-xs pl-1 relative top-[-18px]">{{
              new Date(message.timestamp).toLocaleTimeString()
            }}</em>
          </div>
          <div v-else class="flex justify-end">
            <p class="bg-gray-200 rounded-l-2xl rounded-t-2xl p-3 w-fit">
              {{ message.text }}
            </p>
            <em class="text-xs pl-1 relative right-16 top-14">{{
              new Date(message.timestamp).toLocaleTimeString()
            }}</em>
          </div>
        </div>
      </div>

      <div
        v-else-if="toggle"
        class="chat-window border-2 p-4 font-normal font-sans text-sm md:text-base rounded-lg h-[80vh] overflow-y-scroll"
      >
        <div v-for="(message, idx) in chats" :key="idx">
          <div v-if="message.username == 'AI'">
            <p
              class="bg-black text-white bg-opacity-[.8] rounded-r-2xl rounded-t-2xl p-3 my-4 w-fit"
            >
              {{ message.text }}
            </p>
            <em class="text-xs pl-1 relative top-[-18px]">{{
              new Date(message.timestamp).toLocaleTimeString()
            }}</em>
          </div>
          <div v-else class="flex justify-end">
            <p class="bg-gray-200 rounded-l-2xl rounded-t-2xl p-3 w-fit">
              {{ message.text }}
            </p>
            <em class="text-xs pl-1 relative right-16 top-12">{{
              new Date(message.timestamp).toLocaleTimeString()
            }}</em>
          </div>
        </div>
      </div>

      <div
        v-else-if="chatMessage.messages.length == 0 && !toggle"
        class="border rounded-lg flex p-2"
      >
        <h3 class="border-2 p-1 w-fit m-2 text-xs h-fit font-medium text-gray-500 rounded-lg">
          How to learn cooking?
        </h3>
        <h3 class="border-2 p-1 w-fit m-2 text-xs h-fit font-medium text-gray-500 rounded-lg">
          What's willow chip?
        </h3>
        <h3 class="border-2 p-1 w-fit m-2 text-xs h-fit font-medium text-gray-500 rounded-lg">
          Tell me a joke.
        </h3>
        <h3 class="border-2 p-1 w-fit m-2 text-xs h-fit font-medium text-gray-500 rounded-lg">
          What is websocket?
        </h3>
      </div>

      <div
        class="input-box flex gap-1 items-center my-2 rounded-xl border-2 p-1 md:w-[60%] mx-auto"
      >
        <input
          class="w-full px-2 py-1 outline-none bg-transparent"
          v-model="newMessage"
          @keyup.enter="sendMessage"
          type="text"
        />
        <button class="bg-black text-white px-3 py-1 font-medium rounded-xl" @click="sendMessage">
          Send
        </button>
      </div>
    </div>
  </div>
</template>
