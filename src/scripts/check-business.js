// Script to check business listings in the database
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with hardcoded values
// You should copy these from your .env.local file
const supabaseUrl = 'https://kbjudvamidagzzfvxgov.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtianVkdmFtaWRhZ3p6ZnZ4Z292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODkzOTAsImV4cCI6MjA2Mjk2NTM5MH0.pblb7_LAAG1lgoRzO-xyCZfJhVuKlkrdX4-Dk1seyrc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBusinesses() {
  console.log('Checking for businesses...');

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

  // Check businesses with this community ID
  const { data: businesses, error: businessesError } = await supabase
    .from('businesses')
    .select('*')
    .eq('community_id', communityData.id);

  if (businessesError) {
    console.error('Error fetching businesses:', businessesError);
    return;
  }

  console.log(`Found ${businesses.length} businesses for Miami community`);
  
  if (businesses.length > 0) {
    businesses.forEach((business, index) => {
      console.log(`Business ${index + 1}:`);
      console.log(`  ID: ${business.id}`);
      console.log(`  Name: ${business.name || business.title}`);
      console.log(`  Category ID: ${business.category_id}`);
      console.log(`  Subcategory ID: ${business.subcategory_id}`);
      console.log(`  Community ID: ${business.community_id}`);
      console.log('---');
    });
  }

  // Check for all businesses regardless of community
  const { data: allBusinesses, error: allBusinessesError } = await supabase
    .from('businesses')
    .select('*');

  if (allBusinessesError) {
    console.error('Error fetching all businesses:', allBusinessesError);
    return;
  }

  console.log(`Found ${allBusinesses.length} total businesses in the database`);
  
  // --- DEBUG: Log full info for Code Academy ---
  const codeAcademy = allBusinesses.find(b => b.name && b.name.toLowerCase().includes('code academy'));
  if (codeAcademy) {
    console.log('--- FULL DATA FOR CODE ACADEMY BUSINESS ---');
    console.log(codeAcademy);
    if (codeAcademy.user_id) {
      const { data: ownerProfile, error: ownerProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', codeAcademy.user_id)
        .single();
      if (ownerProfileError) {
        console.error('Error fetching owner profile:', ownerProfileError);
      } else {
        console.log('--- OWNER PROFILE FOR CODE ACADEMY ---');
        console.log(ownerProfile);
      }
    } else {
      console.log('Code Academy business has no user_id set.');
    }
  } else {
    console.log('No business found with name containing "code academy".');
  }

  // Check for categories and subcategories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*');

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    return;
  }

  console.log(`Found ${categories.length} categories`);
  
  const { data: subcategories, error: subcategoriesError } = await supabase
    .from('subcategories')
    .select('*');

  if (subcategoriesError) {
    console.error('Error fetching subcategories:', subcategoriesError);
    return;
  }

  console.log(`Found ${subcategories.length} subcategories`);
}

// Run the function
checkBusinesses().catch(console.error); 