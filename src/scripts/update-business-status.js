// Script to update business approval status for testing
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with hardcoded values
// You should copy these from your .env.local file
const supabaseUrl = 'https://kbjudvamidagzzfvxgov.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtianVkdmFtaWRhZ3p6ZnZ4Z292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODkzOTAsImV4cCI6MjA2Mjk2NTM5MH0.pblb7_LAAG1lgoRzO-xyCZfJhVuKlkrdX4-Dk1seyrc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBusinessStatus() {
  console.log('Updating business approval status...');

  // First, get the community ID for Miami
  const { data: communityData, error: communityError } = await supabase
    .from('communities')
    .select('id')
    .eq('slug', 'miami')
    .single();

  if (communityError) {
    console.error('Error fetching Miami community:', communityError);
    return;
  }

  console.log('Miami community ID:', communityData.id);

  // Find businesses with this community ID
  const { data: businesses, error: businessesError } = await supabase
    .from('businesses')
    .select('*')
    .eq('community_id', communityData.id)
    .limit(5); // Limit to first 5 businesses

  if (businessesError) {
    console.error('Error fetching businesses:', businessesError);
    return;
  }

  console.log(`Found ${businesses.length} businesses for Miami community`);
  
  if (businesses.length > 0) {
    // Update the first business to have pending status
    const businessToUpdate = businesses[0];
    console.log(`Updating business: ${businessToUpdate.name || businessToUpdate.title} (ID: ${businessToUpdate.id})`);
    
    const { data: updatedBusiness, error: updateError } = await supabase
      .from('businesses')
      .update({ 
        approval_status: 'pending'
      })
      .eq('id', businessToUpdate.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating business:', updateError);
    } else {
      console.log('Business updated successfully:', updatedBusiness);
      console.log(`New approval_status: ${updatedBusiness.approval_status}`);
    }
  } else {
    console.log('No businesses found to update');
  }
}

// Run the function
updateBusinessStatus()
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err)); 