<script lang="ts">
  import { invoke } from "@tauri-apps/api/tauri"
  import { createEventDispatcher, onMount } from "svelte";
  import { open } from "@tauri-apps/api/dialog"
  import { blur, fly, fade } from "svelte/transition";
  const dispatch = createEventDispatcher();
  let songs = [];
  let initialSongs = [];
  let selected;
  let initialSelected;
  let activeElement = "";
  let ready = false;
  let settingsDialog;
  let searchPattern = "";
  let options = {};

  function changeTheme(){
    if (localStorage.theme === 'dark') {
      localStorage.theme = "light"
      document.documentElement.classList.remove('dark')
    } else {
      localStorage.theme = "dark"
      document.documentElement.classList.add('dark')
    }
    console.log(document.documentElement.classList)
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
    if (JSON.parse(localStorage.getItem("options")) != null){
      options = JSON.parse(localStorage.getItem("options"))
    }else{
      options = {}
      options.recursive = false
    }
    loadSongs()
    localStorage.theme = localStorage.getItem("theme")
    if(localStorage.theme == "dark"){
      document.documentElement.classList.add("dark")
    }else{
      document.documentElement.classList.remove("dark")
    }
    ready = true
  })
  
  async function loadSongs(){
    songs = await invoke("load_dir", {musicDir: localStorage.getItem("musicDir"), recursive: options.recursive}) 
    for(const song of songs){
      if (song.cover_data != "AA=="){
      song.cover_url = `data:image/jpg;base64,${song.cover_data}`
      }else{
      song.cover_url = "/default.png"
      }
    }
    initialSongs = structuredClone(songs)
  }

  function changeSong(song: object){
    selected = structuredClone(song)
    initialSelected = song
  }

  function resetSong(){
    selected = structuredClone(initialSelected)
  }

  function saveSong(){
    invoke("save_song", { songData: selected })
    .then()
    .catch(e => console.log(e))
    loadSongs()
  }

  function changeActiveElement(id: string){
    activeElement = id
  }
  
  async function changeImage(){
    const image = await open({
      title: "Select a new image",
      directory: false,
      multiple: false
    })
    const [imageData, imageType] = await invoke("image_to_data", { filePath: image });
    selected.cover_url = `data:image/jpg;base64,${imageData}`
    selected.cover_data = imageData
    selected.cover_type = imageType
  }

  async function search(e: KeyboardEvent){
    if (e.key == "Enter"){
      if (searchPattern === ""){
        songs = structuredClone(initialSongs)
      }else{
        invoke('search', { songs: initialSongs, pattern: searchPattern.toLowerCase() })
        .then(res => songs = res)
        .catch(e => console.log(e))
      }
    }
  }
  function closeSettings(e){
  const dialogDimensions = settingsDialog.getBoundingClientRect()
  if (
    e.clientX < dialogDimensions.left ||
    e.clientX > dialogDimensions.right ||
    e.clientY < dialogDimensions.top ||
    e.clientY > dialogDimensions.bottom
  ) {
    settingsDialog.close()
  }
  }

</script>

<div class="dark:bg-gray-600 bg-gray-100">
  {#if ready}
  <div transition:fly={{ delay: 500, duration: 700,  x: -400}} class="w-5/12 h-screen fixed bg-white dark:bg-gray-600 pt-8 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto max-w-lg rounded-r-3xl px-5 left-0 flex border-black">
    <div class="h-2 fixed">
      <button class="py-2 px-2 rounded-md text-center" on:click={changeTheme}>
        {#if localStorage.theme === "dark"}
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path fill="currentColor" d="M13.502 5.414a15.075 15.075 0 0 0 11.594 18.194a11.113 11.113 0 0 1-7.975 3.39c-.138 0-.278.005-.418 0a11.094 11.094 0 0 1-3.2-21.584M14.98 3a1.002 1.002 0 0 0-.175.016a13.096 13.096 0 0 0 1.825 25.981c.164.006.328 0 .49 0a13.072 13.072 0 0 0 10.703-5.555a1.01 1.01 0 0 0-.783-1.565A13.08 13.08 0 0 1 15.89 4.38A1.015 1.015 0 0 0 14.98 3Z"/></svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path fill="currentColor" d="M16 12.005a4 4 0 1 1-4 4a4.005 4.005 0 0 1 4-4m0-2a6 6 0 1 0 6 6a6 6 0 0 0-6-6ZM5.394 6.813L6.81 5.399l3.505 3.506L8.9 10.319zM2 15.005h5v2H2zm3.394 10.193L8.9 21.692l1.414 1.414l-3.505 3.506zM15 25.005h2v5h-2zm6.687-1.9l1.414-1.414l3.506 3.506l-1.414 1.414zm3.313-8.1h5v2h-5zm-3.313-6.101l3.506-3.506l1.414 1.414l-3.506 3.506zM15 2.005h2v5h-2z"/></svg>
        {/if}
      </button>
      <button class="py-2 px-2 rounded-md text-center" on:click={changeDir}>
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 22 22" ><path fill="currentColor" d="M4.65 6.471C4.65 6.05679 4.31421 5.721 3.9 5.721C3.48578 5.721 3.15 6.05679 3.15 6.471H4.65ZM3.9 17.353L4.65 17.3539V17.353H3.9ZM4.36838 18.5168L4.90602 17.9939L4.90602 17.9939L4.36838 18.5168ZM5.50192 19L5.50099 19.75H5.50192V19ZM17.8981 19L17.8981 19.75L17.899 19.75L17.8981 19ZM19.0316 18.5168L18.494 17.9939L18.494 17.9939L19.0316 18.5168ZM19.5 17.353L18.75 17.353L18.75 17.3539L19.5 17.353ZM19.5 8.118L18.75 8.11711V8.118H19.5ZM19.0316 6.95422L18.494 7.47715L18.494 7.47715L19.0316 6.95422ZM17.8981 6.471L17.899 5.721H17.8981V6.471ZM12.2226 5.721C11.8084 5.721 11.4726 6.05679 11.4726 6.471C11.4726 6.88521 11.8084 7.221 12.2226 7.221V5.721ZM3.15 6.471C3.15 6.88521 3.48578 7.221 3.9 7.221C4.31421 7.221 4.65 6.88521 4.65 6.471H3.15ZM3.9 5.647L4.65 5.647L4.64999 5.64611L3.9 5.647ZM4.36838 4.48322L4.90602 5.00615L4.90602 5.00615L4.36838 4.48322ZM5.50192 4L5.50192 3.25L5.50099 3.25L5.50192 4ZM10.6207 4L10.6216 3.25H10.6207V4ZM11.7542 4.48322L11.2166 5.00615L11.2166 5.00615L11.7542 4.48322ZM12.2226 5.647L11.4726 5.64611V5.647H12.2226ZM11.4726 6.471C11.4726 6.88521 11.8084 7.221 12.2226 7.221C12.6368 7.221 12.9726 6.88521 12.9726 6.471H11.4726ZM3.9 5.721C3.48578 5.721 3.15 6.05679 3.15 6.471C3.15 6.88521 3.48578 7.221 3.9 7.221V5.721ZM12.2226 7.221C12.6368 7.221 12.9726 6.88521 12.9726 6.471C12.9726 6.05679 12.6368 5.721 12.2226 5.721V7.221ZM3.15 6.471V17.353H4.65V6.471H3.15ZM3.15 17.3521C3.14925 17.9813 3.39203 18.5886 3.83074 19.0397L4.90602 17.9939C4.74389 17.8272 4.64971 17.5973 4.64999 17.3539L3.15 17.3521ZM3.83074 19.0397C4.27008 19.4914 4.87048 19.7492 5.50099 19.75L5.50285 18.25C5.28261 18.2497 5.06752 18.1599 4.90602 17.9939L3.83074 19.0397ZM5.50192 19.75H17.8981V18.25H5.50192V19.75ZM17.899 19.75C18.5295 19.7492 19.1299 19.4914 19.5692 19.0397L18.494 17.9939C18.3325 18.1599 18.1174 18.2497 17.8971 18.25L17.899 19.75ZM19.5692 19.0397C20.008 18.5886 20.2507 17.9813 20.25 17.3521L18.75 17.3539C18.7503 17.5973 18.6561 17.8272 18.494 17.9939L19.5692 19.0397ZM20.25 17.353V8.118H18.75V17.353H20.25ZM20.25 8.11889C20.2507 7.48974 20.008 6.88236 19.5692 6.4313L18.494 7.47715C18.6561 7.64383 18.7503 7.8737 18.75 8.11711L20.25 8.11889ZM19.5692 6.4313C19.1299 5.9796 18.5295 5.72179 17.899 5.721L17.8971 7.221C18.1174 7.22127 18.3325 7.3111 18.494 7.47715L19.5692 6.4313ZM17.8981 5.721H12.2226V7.221H17.8981V5.721ZM4.65 6.471V5.647H3.15V6.471H4.65ZM4.64999 5.64611C4.64971 5.4027 4.74389 5.17283 4.90602 5.00615L3.83074 3.9603C3.39203 4.41136 3.14925 5.01874 3.15 5.64789L4.64999 5.64611ZM4.90602 5.00615C5.06751 4.8401 5.28261 4.75027 5.50285 4.75L5.50099 3.25C4.87048 3.25079 4.27008 3.5086 3.83074 3.9603L4.90602 5.00615ZM5.50192 4.75H10.6207V3.25H5.50192V4.75ZM10.6197 4.75C10.84 4.75027 11.0551 4.8401 11.2166 5.00615L12.2918 3.9603C11.8525 3.5086 11.2521 3.25079 10.6216 3.25L10.6197 4.75ZM11.2166 5.00615C11.3787 5.17283 11.4729 5.4027 11.4726 5.64611L12.9726 5.64789C12.9733 5.01874 12.7306 4.41136 12.2918 3.9603L11.2166 5.00615ZM11.4726 5.647V6.471H12.9726V5.647H11.4726ZM3.9 7.221H12.2226V5.721H3.9V7.221Z"></path></svg>
      </button>
      <button class="py-2 px-2 rounded-md text-center" on:click={settingsDialog.showModal()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 23 23">><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 8.25C9.92894 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92894 15.75 12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25ZM9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12Z" fill="currentColor"></path> <path  d="M11.9747 1.25C11.5303 1.24999 11.1592 1.24999 10.8546 1.27077C10.5375 1.29241 10.238 1.33905 9.94761 1.45933C9.27379 1.73844 8.73843 2.27379 8.45932 2.94762C8.31402 3.29842 8.27467 3.66812 8.25964 4.06996C8.24756 4.39299 8.08454 4.66251 7.84395 4.80141C7.60337 4.94031 7.28845 4.94673 7.00266 4.79568C6.64714 4.60777 6.30729 4.45699 5.93083 4.40743C5.20773 4.31223 4.47642 4.50819 3.89779 4.95219C3.64843 5.14353 3.45827 5.3796 3.28099 5.6434C3.11068 5.89681 2.92517 6.21815 2.70294 6.60307L2.67769 6.64681C2.45545 7.03172 2.26993 7.35304 2.13562 7.62723C1.99581 7.91267 1.88644 8.19539 1.84541 8.50701C1.75021 9.23012 1.94617 9.96142 2.39016 10.5401C2.62128 10.8412 2.92173 11.0602 3.26217 11.2741C3.53595 11.4461 3.68788 11.7221 3.68786 12C3.68785 12.2778 3.53592 12.5538 3.26217 12.7258C2.92169 12.9397 2.62121 13.1587 2.39007 13.4599C1.94607 14.0385 1.75012 14.7698 1.84531 15.4929C1.88634 15.8045 1.99571 16.0873 2.13552 16.3727C2.26983 16.6469 2.45535 16.9682 2.67758 17.3531L2.70284 17.3969C2.92507 17.7818 3.11058 18.1031 3.28089 18.3565C3.45817 18.6203 3.64833 18.8564 3.89769 19.0477C4.47632 19.4917 5.20763 19.6877 5.93073 19.5925C6.30717 19.5429 6.647 19.3922 7.0025 19.2043C7.28833 19.0532 7.60329 19.0596 7.8439 19.1986C8.08452 19.3375 8.24756 19.607 8.25964 19.9301C8.27467 20.3319 8.31403 20.7016 8.45932 21.0524C8.73843 21.7262 9.27379 22.2616 9.94761 22.5407C10.238 22.661 10.5375 22.7076 10.8546 22.7292C11.1592 22.75 11.5303 22.75 11.9747 22.75H12.0252C12.4697 22.75 12.8407 22.75 13.1454 22.7292C13.4625 22.7076 13.762 22.661 14.0524 22.5407C14.7262 22.2616 15.2616 21.7262 15.5407 21.0524C15.686 20.7016 15.7253 20.3319 15.7403 19.93C15.7524 19.607 15.9154 19.3375 16.156 19.1985C16.3966 19.0596 16.7116 19.0532 16.9974 19.2042C17.3529 19.3921 17.6927 19.5429 18.0692 19.5924C18.7923 19.6876 19.5236 19.4917 20.1022 19.0477C20.3516 18.8563 20.5417 18.6203 20.719 18.3565C20.8893 18.1031 21.0748 17.7818 21.297 17.3969L21.3223 17.3531C21.5445 16.9682 21.7301 16.6468 21.8644 16.3726C22.0042 16.0872 22.1135 15.8045 22.1546 15.4929C22.2498 14.7697 22.0538 14.0384 21.6098 13.4598C21.3787 13.1586 21.0782 12.9397 20.7378 12.7258C20.464 12.5538 20.3121 12.2778 20.3121 11.9999C20.3121 11.7221 20.464 11.4462 20.7377 11.2742C21.0783 11.0603 21.3788 10.8414 21.6099 10.5401C22.0539 9.96149 22.2499 9.23019 22.1547 8.50708C22.1136 8.19546 22.0043 7.91274 21.8645 7.6273C21.7302 7.35313 21.5447 7.03183 21.3224 6.64695L21.2972 6.60318C21.0749 6.21825 20.8894 5.89688 20.7191 5.64347C20.5418 5.37967 20.3517 5.1436 20.1023 4.95225C19.5237 4.50826 18.7924 4.3123 18.0692 4.4075C17.6928 4.45706 17.353 4.60782 16.9975 4.79572C16.7117 4.94679 16.3967 4.94036 16.1561 4.80144C15.9155 4.66253 15.7524 4.39297 15.7403 4.06991C15.7253 3.66808 15.686 3.2984 15.5407 2.94762C15.2616 2.27379 14.7262 1.73844 14.0524 1.45933C13.762 1.33905 13.4625 1.29241 13.1454 1.27077C12.8407 1.24999 12.4697 1.24999 12.0252 1.25H11.9747ZM10.5216 2.84515C10.5988 2.81319 10.716 2.78372 10.9567 2.76729C11.2042 2.75041 11.5238 2.75 12 2.75C12.4762 2.75 12.7958 2.75041 13.0432 2.76729C13.284 2.78372 13.4012 2.81319 13.4783 2.84515C13.7846 2.97202 14.028 3.21536 14.1548 3.52165C14.1949 3.61826 14.228 3.76887 14.2414 4.12597C14.271 4.91835 14.68 5.68129 15.4061 6.10048C16.1321 6.51968 16.9974 6.4924 17.6984 6.12188C18.0143 5.9549 18.1614 5.90832 18.265 5.89467C18.5937 5.8514 18.9261 5.94047 19.1891 6.14228C19.2554 6.19312 19.3395 6.27989 19.4741 6.48016C19.6125 6.68603 19.7726 6.9626 20.0107 7.375C20.2488 7.78741 20.4083 8.06438 20.5174 8.28713C20.6235 8.50382 20.6566 8.62007 20.6675 8.70287C20.7108 9.03155 20.6217 9.36397 20.4199 9.62698C20.3562 9.70995 20.2424 9.81399 19.9397 10.0041C19.2684 10.426 18.8122 11.1616 18.8121 11.9999C18.8121 12.8383 19.2683 13.574 19.9397 13.9959C20.2423 14.186 20.3561 14.29 20.4198 14.373C20.6216 14.636 20.7107 14.9684 20.6674 15.2971C20.6565 15.3799 20.6234 15.4961 20.5173 15.7128C20.4082 15.9355 20.2487 16.2125 20.0106 16.6249C19.7725 17.0373 19.6124 17.3139 19.474 17.5198C19.3394 17.72 19.2553 17.8068 19.189 17.8576C18.926 18.0595 18.5936 18.1485 18.2649 18.1053C18.1613 18.0916 18.0142 18.045 17.6983 17.8781C16.9973 17.5075 16.132 17.4803 15.4059 17.8995C14.68 18.3187 14.271 19.0816 14.2414 19.874C14.228 20.2311 14.1949 20.3817 14.1548 20.4784C14.028 20.7846 13.7846 21.028 13.4783 21.1549C13.4012 21.1868 13.284 21.2163 13.0432 21.2327C12.7958 21.2496 12.4762 21.25 12 21.25C11.5238 21.25 11.2042 21.2496 10.9567 21.2327C10.716 21.2163 10.5988 21.1868 10.5216 21.1549C10.2154 21.028 9.97201 20.7846 9.84514 20.4784C9.80512 20.3817 9.77195 20.2311 9.75859 19.874C9.72896 19.0817 9.31997 18.3187 8.5939 17.8995C7.86784 17.4803 7.00262 17.5076 6.30158 17.8781C5.98565 18.0451 5.83863 18.0917 5.73495 18.1053C5.40626 18.1486 5.07385 18.0595 4.81084 17.8577C4.74458 17.8069 4.66045 17.7201 4.52586 17.5198C4.38751 17.314 4.22736 17.0374 3.98926 16.625C3.75115 16.2126 3.59171 15.9356 3.4826 15.7129C3.37646 15.4962 3.34338 15.3799 3.33248 15.2971C3.28921 14.9684 3.37828 14.636 3.5801 14.373C3.64376 14.2901 3.75761 14.186 4.0602 13.9959C4.73158 13.5741 5.18782 12.8384 5.18786 12.0001C5.18791 11.1616 4.73165 10.4259 4.06021 10.004C3.75769 9.81389 3.64385 9.70987 3.58019 9.62691C3.37838 9.3639 3.28931 9.03149 3.33258 8.7028C3.34348 8.62001 3.37656 8.50375 3.4827 8.28707C3.59181 8.06431 3.75125 7.78734 3.98935 7.37493C4.22746 6.96253 4.3876 6.68596 4.52596 6.48009C4.66055 6.27983 4.74468 6.19305 4.81093 6.14222C5.07395 5.9404 5.40636 5.85133 5.73504 5.8946C5.83873 5.90825 5.98576 5.95483 6.30173 6.12184C7.00273 6.49235 7.86791 6.51962 8.59394 6.10045C9.31998 5.68128 9.72896 4.91837 9.75859 4.12602C9.77195 3.76889 9.80512 3.61827 9.84514 3.52165C9.97201 3.21536 10.2154 2.97202 10.5216 2.84515Z" fill="currentColor"></path></g></svg>
      </button>
      <button class="py-2 px-2 rounded-md text-center" on:click={loadSongs}>
        <svg viewBox="0 0 24 24" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3.67981 11.3333H2.92981H3.67981ZM3.67981 13L3.15157 13.5324C3.44398 13.8225 3.91565 13.8225 4.20805 13.5324L3.67981 13ZM5.88787 11.8657C6.18191 11.574 6.18377 11.0991 5.89203 10.8051C5.60029 10.511 5.12542 10.5092 4.83138 10.8009L5.88787 11.8657ZM2.52824 10.8009C2.2342 10.5092 1.75933 10.511 1.46759 10.8051C1.17585 11.0991 1.17772 11.574 1.47176 11.8657L2.52824 10.8009ZM18.6156 7.39279C18.8325 7.74565 19.2944 7.85585 19.6473 7.63892C20.0001 7.42199 20.1103 6.96007 19.8934 6.60721L18.6156 7.39279ZM16.8931 3.60787C16.5403 3.39077 16.0784 3.50074 15.8613 3.8535C15.6442 4.20626 15.7541 4.66822 16.1069 4.88532L16.8931 3.60787ZM12.4633 3.75939C12.877 3.77966 13.2288 3.46071 13.2491 3.047C13.2694 2.63328 12.9504 2.28146 12.5367 2.26119L12.4633 3.75939ZM12.0789 2.25C7.03155 2.25 2.92981 6.3112 2.92981 11.3333H4.42981C4.42981 7.15072 7.84884 3.75 12.0789 3.75V2.25ZM2.92981 11.3333L2.92981 13H4.42981L4.42981 11.3333H2.92981ZM4.20805 13.5324L5.88787 11.8657L4.83138 10.8009L3.15157 12.4676L4.20805 13.5324ZM4.20805 12.4676L2.52824 10.8009L1.47176 11.8657L3.15157 13.5324L4.20805 12.4676ZM19.8934 6.60721C19.1441 5.38846 18.1143 4.35941 16.8931 3.60787L16.1069 4.88532C17.1287 5.51419 17.9899 6.37506 18.6156 7.39279L19.8934 6.60721ZM12.5367 2.26119C12.385 2.25376 12.2323 2.25 12.0789 2.25V3.75C12.2078 3.75 12.336 3.75316 12.4633 3.75939L12.5367 2.26119Z" fill="currentColor"></path> <path d="M11.8825 21V21.75V21ZM20.3137 12.6667H21.0637H20.3137ZM20.3137 11L20.8409 10.4666C20.5487 10.1778 20.0786 10.1778 19.7864 10.4666L20.3137 11ZM18.1002 12.1333C17.8056 12.4244 17.8028 12.8993 18.094 13.1939C18.3852 13.4885 18.86 13.4913 19.1546 13.2001L18.1002 12.1333ZM21.4727 13.2001C21.7673 13.4913 22.2421 13.4885 22.5333 13.1939C22.8245 12.8993 22.8217 12.4244 22.5271 12.1332L21.4727 13.2001ZM5.31769 16.6061C5.10016 16.2536 4.63806 16.1442 4.28557 16.3618C3.93307 16.5793 3.82366 17.0414 4.0412 17.3939L5.31769 16.6061ZM11.5331 20.2423C11.1193 20.224 10.769 20.5447 10.7507 20.9585C10.7325 21.3723 11.0531 21.7226 11.4669 21.7408L11.5331 20.2423ZM7.11292 20.4296C7.4677 20.6433 7.92861 20.529 8.14239 20.1742C8.35617 19.8195 8.24186 19.3586 7.88708 19.1448L7.11292 20.4296ZM11.8825 21.75C16.9448 21.75 21.0637 17.6915 21.0637 12.6667H19.5637C19.5637 16.8466 16.133 20.25 11.8825 20.25V21.75ZM21.0637 12.6667V11H19.5637V12.6667H21.0637ZM19.7864 10.4666L18.1002 12.1333L19.1546 13.2001L20.8409 11.5334L19.7864 10.4666ZM19.7864 11.5334L21.4727 13.2001L22.5271 12.1332L20.8409 10.4666L19.7864 11.5334ZM11.4669 21.7408C11.6047 21.7469 11.7433 21.75 11.8825 21.75V20.25C11.7653 20.25 11.6488 20.2474 11.5331 20.2423L11.4669 21.7408ZM4.0412 17.3939C4.80569 18.6327 5.86106 19.6752 7.11292 20.4296L7.88708 19.1448C6.83872 18.5131 5.95602 17.6405 5.31769 16.6061L4.0412 17.3939Z" fill="currentColor"></path> </g></svg>
      </button>
      <dialog transition:fade={{}} class="rounded-lg h-1/2 aspect-square bg-white dark:bg-gray-800" id="settings" bind:this={settingsDialog} on:click={closeSettings}>
        <div class="flex flex-col h-5/6">
        <button class="self-end" on:click={settingsDialog.close()}><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="currentColor"></path> </g></svg></button>
        <div class="mb-4 border-white rounded-lg border-2 h-full p-2">
          <label for="recursiveField" class="text-white"><strong>Search Directories Recursively</strong></label>
          <input id="recursiveField" type="checkbox" class="form-checkbox mx-2 h-4 w-4" bind:checked={options.recursive}> 
        </div>
        </div>
        <button class="rounded-md" on:click={localStorage.setItem("options", JSON.stringify(options))}>Save</button>
      </dialog>
      <input class="ml-auto rounded-xl px-3 pt-2 right-0" type="text" placeholder="Search" bind:value={searchPattern} on:keypress={search}>
    </div>
    <div class="container flex items-center flex-col justify-center">
      {#if selected != null}
      <label class="font-black px-10 text-xl">{selected.file_name}</label>
      {#key selected.cover_url}
        <img in:blur={{}} class="w-full px-10" src={selected.cover_url} alt="" on:click={changeImage}>
      {/key}
      <div class="grid grid-cols-2 mx-10 gap-x-4 gap-y-2">
        <div class="flex flex-col">
          <label for="titleField"><strong>Title</strong></label>
          <input id="titleField" type="text" bind:value={selected.title} placeholder={initialSelected.title}>
        </div>
        <div class="flex flex-col">
          <label for="artistField"><strong>Artist</strong></label>
          <input id="artistField" type="text" bind:value={selected.artist} placeholder={initialSelected.artist}>
        </div>
        <div class="flex flex-col">
          <label for="yearField"><strong>Year</strong></label>
          <input id="yearField" type="text" bind:value={selected.year} placeholder={initialSelected.year}>
        </div>
        <div class="flex flex-col">
          <label for="genreField"><strong>Genre</strong></label>
          <input id="genreField" type="text" bind:value={selected.genre} placeholder={initialSelected.genre}>
        </div>
        <div class="flex flex-col">
          <label for="albumTitleField"><strong>Album Title</strong></label>
          <input id="albumTitleField" type="text" bind:value={selected.album_title} placeholder={initialSelected.album_title}>
        </div>
        <div class="flex flex-col">
          <label for="albumArtistField"><strong>Album Artist</strong></label>
          <input id="albumArtistField" type="text" bind:value={selected.album_artist} placeholder={initialSelected.album_artist}>
        </div>
        <div class="flex flex-col">
          <label for="trackField"><strong>Track</strong></label>
          <input id="trackField" type="text" bind:value={selected.track_number} placeholder={initialSelected.track_number}>
        </div>
        <div class="flex flex-col">
          <label for="discNumberField"><strong>Disc Number</strong></label>
          <input id="discNumberField" type="text" bind:value={selected.disc_number} placeholder={initialSelected.disc_number}>
        </div>
        <button class="text-xl" on:click={saveSong}>Save</button>
        <button class="text-xl" on:click={resetSong}>Reset</button>
      </div>
      {:else}
      <img class="w-full px-10" src="/default.png" alt="" >
      {/if}
    </div>
  </div>
  <div transition:fly={{ delay: 100, duration: 1000, y: 1000}} class="fixed justify-end xl:w-8/12 w-7/12 h-full right-0 overflow-x-auto">
    <table class="table-fixed">
      <thead class="sticky top-0 dark:bg-gray-600 bg-white">
        <tr>
          <th class="px-2 rounded-l-xl dark:text-white text-black">Cover</th>
          <th class="dark:text-white text-black">File Name</th>
          <th class="dark:text-white text-black">Song</th>
          <th class="dark:text-white text-black">Artist</th>
          <th class="dark:text-white text-black">Year</th>
          <th class="dark:text-white text-black">Genre</th>
          <th class="dark:text-white text-black">Album Title</th>
          <th class="dark:text-white text-black">Album Artist</th>
          <th class="dark:text-white text-black">Track</th>
          <th class="dark:text-white text-black px-2 rounded-r-xl">Disc Number</th>
        </tr>
      </thead>
      <tbody class="overflow-y-auto">
        {#each songs as song}
        <tr in:fade={{delay: 100, duration: 500}} class="transition ease-in-out hover:dark:bg-gray-800 hover:bg-gray-200 duration-500 rounded-l-3xl max-h-4 {activeElement === song.file_name ? 'active' : ''}" id={song.file_name} on:click={() => {changeSong(song); changeActiveElement(song.file_name)}}>
          <td class="rounded-l-3xl">
          {#if song.cover_url}
          <img class="rounded-3xl max-h-20" src={song.cover_url} alt={song.title}>
          {:else}
          <img src="/default.png" alt={song.title}>
          {/if}
          </td>
          <td class="dark:text-white text-black max-w-sm truncate">{song.file_path}</td>
          <td class="dark:text-white text-black">{song.title}</td>
          <td class="dark:text-white text-black">{song.artist}</td>
          <td class="dark:text-white text-black">{song.year}</td>
          <td class="dark:text-white text-black">{song.genre}</td>
          <td class="dark:text-white text-black">{song.album_title}</td>
          <td class="dark:text-white text-black">{song.album_artist}</td>
          <td class="dark:text-white text-black">{song.track_number}</td>
          <td class="dark:text-white text-black rounded-r-3xl">{song.disc_number}</td>
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
  input{
    border-radius: 0.75rem;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    padding-top: 0.2rem;
  }
  td{
    font-weight: 500;
  }
</style>
