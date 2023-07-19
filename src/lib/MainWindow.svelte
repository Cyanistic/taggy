<script lang="ts">
  import { invoke } from "@tauri-apps/api/tauri"
  import { createEventDispatcher, onMount } from "svelte";
  import { open } from "@tauri-apps/api/dialog"
  import { slide, fly, fade } from "svelte/transition";
  import { backIn, cubicIn, quadInOut, quintOut } from 'svelte/easing';
  const dispatch = createEventDispatcher();
  let songs = [];
  let selected;
  let activeElement = "";
  let ready = false;


  function changeTheme(){

  }

  async function changeDir(){
    const selected = await open({
      title: "Select your music directory",
      directory: true,
      multiple: false
    })
    if (selected == null) {
      return 
    }
    dispatch("updateDir", selected)
  }

  onMount(async () => {
    loadSongs()
    const theme = localStorage.getItem("theme")
    if(theme == "dark"){
      document.documentElement.classList.add("dark")
    }else{
      document.documentElement.classList.remove("dark")
    }
    ready = true
  })
  
  async function loadSongs(){
    songs = await invoke("load_dir", {musicDir: localStorage.getItem("musicDir")}) 
    console.log("musicDir", localStorage.getItem("musicDir"))
    for(const song of songs){
      if (song.cover_data != "AA=="){
      song.cover_path = `data:image/jpg;base64,${song.cover_data}`
      }else{
      song.cover_path = "../../public/default.png"
      }
    }
  }

  function changeSong(song: object){
    selected = song.song
  }

  function changeActiveElement(id: string){
    activeElement = id
  }
</script>

<div>
  {#if ready}
  <div transition:fly={{ delay: 1000, duration: 700,  x: -400}} class="w-1/2 h-full fixed bg-white dark:bg-gray-600 pt-8 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-lg sm:rounded-r-3xl sm:px-5 left-0 flex">
    <div class="h-2 fixed items-start">
      <button class="py-2 px-2 rounded-md text-center" on:click={changeTheme}>
        {#if localStorage.getItem("theme") == "dark"}
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path fill="currentColor" d="M13.502 5.414a15.075 15.075 0 0 0 11.594 18.194a11.113 11.113 0 0 1-7.975 3.39c-.138 0-.278.005-.418 0a11.094 11.094 0 0 1-3.2-21.584M14.98 3a1.002 1.002 0 0 0-.175.016a13.096 13.096 0 0 0 1.825 25.981c.164.006.328 0 .49 0a13.072 13.072 0 0 0 10.703-5.555a1.01 1.01 0 0 0-.783-1.565A13.08 13.08 0 0 1 15.89 4.38A1.015 1.015 0 0 0 14.98 3Z"/></svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path fill="currentColor" d="M16 12.005a4 4 0 1 1-4 4a4.005 4.005 0 0 1 4-4m0-2a6 6 0 1 0 6 6a6 6 0 0 0-6-6ZM5.394 6.813L6.81 5.399l3.505 3.506L8.9 10.319zM2 15.005h5v2H2zm3.394 10.193L8.9 21.692l1.414 1.414l-3.505 3.506zM15 25.005h2v5h-2zm6.687-1.9l1.414-1.414l3.506 3.506l-1.414 1.414zm3.313-8.1h5v2h-5zm-3.313-6.101l3.506-3.506l1.414 1.414l-3.506 3.506zM15 2.005h2v5h-2z"/></svg>
        {/if}
      </button>
      <button class="py-2 px-2 rounded-md text-center" on:click={changeDir}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.65 6.471C4.65 6.05679 4.31421 5.721 3.9 5.721C3.48578 5.721 3.15 6.05679 3.15 6.471H4.65ZM3.9 17.353L4.65 17.3539V17.353H3.9ZM4.36838 18.5168L4.90602 17.9939L4.90602 17.9939L4.36838 18.5168ZM5.50192 19L5.50099 19.75H5.50192V19ZM17.8981 19L17.8981 19.75L17.899 19.75L17.8981 19ZM19.0316 18.5168L18.494 17.9939L18.494 17.9939L19.0316 18.5168ZM19.5 17.353L18.75 17.353L18.75 17.3539L19.5 17.353ZM19.5 8.118L18.75 8.11711V8.118H19.5ZM19.0316 6.95422L18.494 7.47715L18.494 7.47715L19.0316 6.95422ZM17.8981 6.471L17.899 5.721H17.8981V6.471ZM12.2226 5.721C11.8084 5.721 11.4726 6.05679 11.4726 6.471C11.4726 6.88521 11.8084 7.221 12.2226 7.221V5.721ZM3.15 6.471C3.15 6.88521 3.48578 7.221 3.9 7.221C4.31421 7.221 4.65 6.88521 4.65 6.471H3.15ZM3.9 5.647L4.65 5.647L4.64999 5.64611L3.9 5.647ZM4.36838 4.48322L4.90602 5.00615L4.90602 5.00615L4.36838 4.48322ZM5.50192 4L5.50192 3.25L5.50099 3.25L5.50192 4ZM10.6207 4L10.6216 3.25H10.6207V4ZM11.7542 4.48322L11.2166 5.00615L11.2166 5.00615L11.7542 4.48322ZM12.2226 5.647L11.4726 5.64611V5.647H12.2226ZM11.4726 6.471C11.4726 6.88521 11.8084 7.221 12.2226 7.221C12.6368 7.221 12.9726 6.88521 12.9726 6.471H11.4726ZM3.9 5.721C3.48578 5.721 3.15 6.05679 3.15 6.471C3.15 6.88521 3.48578 7.221 3.9 7.221V5.721ZM12.2226 7.221C12.6368 7.221 12.9726 6.88521 12.9726 6.471C12.9726 6.05679 12.6368 5.721 12.2226 5.721V7.221ZM3.15 6.471V17.353H4.65V6.471H3.15ZM3.15 17.3521C3.14925 17.9813 3.39203 18.5886 3.83074 19.0397L4.90602 17.9939C4.74389 17.8272 4.64971 17.5973 4.64999 17.3539L3.15 17.3521ZM3.83074 19.0397C4.27008 19.4914 4.87048 19.7492 5.50099 19.75L5.50285 18.25C5.28261 18.2497 5.06752 18.1599 4.90602 17.9939L3.83074 19.0397ZM5.50192 19.75H17.8981V18.25H5.50192V19.75ZM17.899 19.75C18.5295 19.7492 19.1299 19.4914 19.5692 19.0397L18.494 17.9939C18.3325 18.1599 18.1174 18.2497 17.8971 18.25L17.899 19.75ZM19.5692 19.0397C20.008 18.5886 20.2507 17.9813 20.25 17.3521L18.75 17.3539C18.7503 17.5973 18.6561 17.8272 18.494 17.9939L19.5692 19.0397ZM20.25 17.353V8.118H18.75V17.353H20.25ZM20.25 8.11889C20.2507 7.48974 20.008 6.88236 19.5692 6.4313L18.494 7.47715C18.6561 7.64383 18.7503 7.8737 18.75 8.11711L20.25 8.11889ZM19.5692 6.4313C19.1299 5.9796 18.5295 5.72179 17.899 5.721L17.8971 7.221C18.1174 7.22127 18.3325 7.3111 18.494 7.47715L19.5692 6.4313ZM17.8981 5.721H12.2226V7.221H17.8981V5.721ZM4.65 6.471V5.647H3.15V6.471H4.65ZM4.64999 5.64611C4.64971 5.4027 4.74389 5.17283 4.90602 5.00615L3.83074 3.9603C3.39203 4.41136 3.14925 5.01874 3.15 5.64789L4.64999 5.64611ZM4.90602 5.00615C5.06751 4.8401 5.28261 4.75027 5.50285 4.75L5.50099 3.25C4.87048 3.25079 4.27008 3.5086 3.83074 3.9603L4.90602 5.00615ZM5.50192 4.75H10.6207V3.25H5.50192V4.75ZM10.6197 4.75C10.84 4.75027 11.0551 4.8401 11.2166 5.00615L12.2918 3.9603C11.8525 3.5086 11.2521 3.25079 10.6216 3.25L10.6197 4.75ZM11.2166 5.00615C11.3787 5.17283 11.4729 5.4027 11.4726 5.64611L12.9726 5.64789C12.9733 5.01874 12.7306 4.41136 12.2918 3.9603L11.2166 5.00615ZM11.4726 5.647V6.471H12.9726V5.647H11.4726ZM3.9 7.221H12.2226V5.721H3.9V7.221Z" fill="#000000"></path></svg>
      </button>
    </div>
    <div class="container flex items-center flex-col justify-center">
      {#if selected != null}
      <label class="font-black px-10 text-xl">{selected.file_name}</label>
      <img class="w-full px-10" src={selected.cover_path} alt="" >
      <div class="grid grid-cols-2 mx-10 gap-x-4 gap-y-2">
        <div class="flex flex-col">
          <label for="titleField"><strong>Title</strong></label>
          <input id="titleField" type="text" bind:value={selected.title}>
        </div>
        <div class="flex flex-col">
          <label for="artistField"><strong>Artist</strong></label>
          <input id="artistField" type="text" bind:value={selected.artist}>
        </div>
        <div class="flex flex-col">
          <label for="yearField"><strong>Year</strong></label>
          <input id="yearField" type="text" bind:value={selected.year}>
        </div>
        <div class="flex flex-col">
          <label for="genreField"><strong>Genre</strong></label>
          <input id="genreField" type="text" bind:value={selected.genre}>
        </div>
        <div class="flex flex-col">
          <label for="albumTitleField"><strong>Album Title</strong></label>
          <input id="albumTitleField" type="text" bind:value={selected.album_title}>
        </div>
        <div class="flex flex-col">
          <label for="albumArtistField"><strong>Album Artist</strong></label>
          <input id="albumArtistField" type="text" bind:value={selected.album_artist}>
        </div>
        <div class="flex flex-col">
          <label for="trackField"><strong>Track</strong></label>
          <input id="trackField" type="text" bind:value={selected.track_number}>
        </div>
        <div class="flex flex-col">
          <label for="discNumberField"><strong>Disc Number</strong></label>
          <input id="discNumberField" type="text" bind:value={selected.disc_number}>
        </div>
        <button class="text-xl">Save</button>
        <button class="text-xl" on:click={() => changeSong({selected})}>Reset</button>
      </div>
      {:else}
      <img class="w-full px-10" src="/default.png" alt="" >
      {/if}
    </div>
  </div>
  <div transition:fly={{ delay: 100, duration: 1000, y: 1000}} class="fixed justify-end lg:w-8/12 md:w-1/2 h-full right-10 overflow-x-auto">
    <table>
      <thead class="sticky top-0 bg-gray-600">
        <tr>
          <th>Cover</th>
          <th>File Name</th>
          <th>Song</th>
          <th>Artist</th>
          <th>Year</th>
          <th>Genre</th>
          <th>Album Title</th>
          <th>Album Artist</th>
          <th>Track</th>
          <th>Disc Number</th>
        </tr>
      </thead>
      <tbody class="overflow-y-auto">
        {#each songs as song}
        <tr transition:fade={{delay: 300, duration: 500}} class="transition ease-in-out hover:dark:bg-gray-800 duration-500 rounded-l-3xl {activeElement === song.file_name ? 'active' : ''}" id={song.file_name} on:click={() => {changeSong({song}); changeActiveElement(song.file_name)}}>
          <td class="rounded-l-3xl">
          {#if song.cover_path}
          <img class="rounded-3xl" src={song.cover_path} alt={song.title}>
          {:else}
          <img src="/default.png" alt={song.title}>
          {/if}
          </td>
          <td class="max-w-sm truncate">{song.file_path}</td>
          <td>{song.title}</td>
          <td>{song.artist}</td>
          <td>{song.year}</td>
          <td>{song.genre}</td>
          <td>{song.album_title}</td>
          <td>{song.album_artist}</td>
          <td>{song.track_number}</td>
          <td class="rounded-r-3xl">{song.disc_number}</td>
        </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {/if}
</div>

<style>
  .active{
    background-color: #202123;
  }
  button{
    border-radius: 10px;
  }
  button:hover{
    background-color: #112D4E;    
  }
</style>
