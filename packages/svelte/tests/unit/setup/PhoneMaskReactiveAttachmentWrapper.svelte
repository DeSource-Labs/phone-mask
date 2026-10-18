<script lang="ts">
  import { phoneMaskAttachment } from '@src/directives/phoneMaskAttachment.svelte';
  import type { PhoneNumber } from '@src/types';

  let digits = $state('2025550199');
  const onChange = (phone: PhoneNumber) => {
    digits = phone.digits;
  };
</script>

<input value="2025550199" {@attach phoneMaskAttachment({ country: 'US', onChange })} />
<output>{digits}</output>
