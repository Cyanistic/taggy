<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/tauri";
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
    musicDir = localStorage.musicDir;
  })
</script>

<main class="container bg">
  {#if !musicDir}
  <DirPopup />
  {:else}
  <MainWindow/>
  {/if}
</main>

<style>
</style>
