import { ref, onMounted } from 'vue';

const CACHE_KEY = '@desource/phone-mask-demo.gh-stars';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Fetches the star count for a GitHub repository
 * @param repo - Repository in format "owner/repo"
 * @returns Promise<number> - The star count
 */
export const getStarsCount = async (repo: string = 'DeSource-Labs/phone-mask'): Promise<number> => {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`);

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data.stargazers_count || 0;
  } catch (error) {
    console.error('Error fetching GitHub stars:', error);
    return 0;
  }
};

export function useGhStars() {
  const stars = ref<number | undefined>(undefined);

  const fetchStars = async () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);

      if (cachedData) {
        const { count, timestamp } = JSON.parse(cachedData);
        const now = Date.now();

        if (now - timestamp < CACHE_DURATION) {
          stars.value = count;
          return;
        }
      }

      const count = await getStarsCount();

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          count,
          timestamp: Date.now()
        })
      );

      stars.value = count;
    } catch (error) {
      console.error('Error fetching stars:', error);

      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { count } = JSON.parse(cachedData);
        stars.value = count;
      }
    }
  };

  onMounted(() => {
    fetchStars();
  });

  return stars;
}
