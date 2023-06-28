<script lang="ts">
  import { onMount } from "svelte";
  import DirPopup from "./lib/DirPopup.svelte";
  import MainWindow from "./lib/MainWindow.svelte";
  let musicDir = "";

  onMount(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    // Whenever the user explicitly chooses light mode
    localStorage.theme = 'light'
    // Whenever the user explicitly chooses dark mode
    localStorage.theme = 'dark'
    // Whenever the user explicitly chooses to respect the OS preference
    localStorage.removeItem('theme')
    musicDir = localStorage.getItem("musicDir");
  })
  function updateDirVar(val: CustomEvent<string>){
    musicDir = val.detail;
    localStorage.setItem("musicDir", musicDir);
  }

</script>

<main class="container bg">
  {#if !musicDir}
  <DirPopup on:updateDir={updateDirVar}/>
  {:else}
  <MainWindow on:updateDir={updateDirVar}/>
  {/if}
</main>

<style>

</style>
