<script lang="ts">
  import { open } from "@tauri-apps/api/dialog"
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition"
  const dispatch = createEventDispatcher();

  async function getDir(){
    const selected = await open({
      title: "Select your music directory",
      directory: true,
      multiple: false
    })
    dispatch("updateDir", selected)
  }
</script>

<div class="flex h-screen w-screen justify-center items-center">
  <div in:fade={{}} class="justify-center items-center w-1/2 h-1/2 border-white border-2 rounded-xl flex flex-col bg-gray-900 gap-4">
    <img src="/default.png" alt="">
    <h1 class="text-3xl font-bold">Welcome to Taggy!</h1>
    <h2 class="text-xl">Select your music directory to get started.</h2>
    <button class="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100" on:click={getDir}>Select</button>
  </div>
</div>


