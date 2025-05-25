# Supabase Tables Schema

## profiles
| Column         | Type      | Description                                 |
|---------------|-----------|---------------------------------------------|
| id            | uuid      | Primary key, user ID                        |
| username      | text      | User's display name/handle                  |
| email         | text      | User's email address                        |
| role          | text      | User role (`user`, `business`, `superadmin`)|
| community_id  | uuid/text | Linked community                            |
| avatar_url    | text      | URL to profile avatar (from `avatars` bucket)|
| approval_status| text     | Approval state (`pending`, `approved`, etc.)|
| created_at    | timestamp | When the profile was created                 |
| updated_at    | timestamp | Last update time                             |
| is_admin      | boolean   | Is this user an admin?                       |
| phone         | text      | User's phone number                          |
| bio           | text      | User's bio/description                       |

## post_reports
| Column      | Type      | Default Value      | Description                        |
|-------------|-----------|-------------------|------------------------------------|
| id          | uuid      | gen_random_uuid() | Primary key                        |
| post_id     | uuid      | NULL              | ID of the reported post (FK)       |
| reporter_id | uuid      | NULL              | ID of the user reporting (FK)      |
| reason      | text      | NULL              | Reason for the report              |
| created_at  | timestamp | now()             | When the report was created        |

## posts
| Column              | Type      | Description                                      |
|---------------------|-----------|--------------------------------------------------|
| id                  | uuid      | Primary key                                      |
| user_id             | uuid      | Author of the post (FK to profiles)              |
| community_id        | uuid      | Community where the post was made (FK)           |
| type                | text      | Post type (e.g., general, ask, event, etc.)      |
| title               | text      | Title of the post                                |
| content             | text      | Main content/body of the post                    |
| hashtags            | text[]    | Array of hashtags                                |
| mentioned_user_ids  | uuid[]    | Array of mentioned user IDs                      |
| is_visible          | boolean   | Is the post visible?                             |
| is_pinned           | boolean   | Is the post pinned?                              |
| parent_post_id      | uuid      | For comments/replies (self-referencing FK)       |
| depth               | integer   | Nesting level (for threads/replies)              |
| created_at          | timestamp | When the post was created                        |
| updated_at          | timestamp | Last update time                                 |
| images              | text[]    | Array of image URLs (from feedpostimages bucket) |
| video_url           | text      | Video URL (from feedpostvideos bucket)           |
| deleted_at          | timestamp | When the post was deleted (soft delete)          |

## poll_votes
| Column         | Type      | Description                                 |
|----------------|-----------|---------------------------------------------|
| id             | uuid      | Primary key                                 |
| poll_post_id   | uuid      | The poll (post) this vote belongs to (FK)   |
| poll_option_id | uuid      | The option selected (FK to poll_options)    |
| user_id        | uuid      | The user who voted (FK to profiles)         |
| voted_at       | timestamp | When the vote was cast                      |

## polls
| Column      | Type      | Description                                 |
|-------------|-----------|---------------------------------------------|
| id          | uuid      | Primary key                                 |
| post_id     | uuid      | The post this poll is attached to (FK)      |
| question    | text      | The poll question                           |
| created_at  | timestamp | When the poll was created                   |
| updated_at  | timestamp | Last update time                            |

## properties
| Column          | Type      | Description                                         |
|-----------------|-----------|-----------------------------------------------------|
| id              | uuid      | Primary key                                         |
| title           | text      | Property title                                      |
| description     | text      | Description                                         |
| price           | numeric   | Price                                               |
| city            | text      | City                                                |
| location        | text      | Address/location                                    |
| squarefeet      | integer   | Square footage                                      |
| bedrooms        | integer   | Number of bedrooms                                  |
| bathrooms       | integer   | Number of bathrooms                                 |
| selectedtags    | text[]    | Array of selected tags                              |
| created_at      | timestamp | When the property was created                       |
| updated_at      | timestamp | Last update time                                    |
| hasParking      | boolean   | Has parking                                         |
| isFurnished     | boolean   | Is furnished                                        |
| isPetFriendly   | boolean   | Is pet friendly                                     |
| imageFiles      | text[]    | Array of image URLs (from propertyimages bucket)    |
| hasVirtualTour  | boolean   | Has a virtual tour                                 |
| listingType     | text      | Listing type (e.g., Rent, Sale)                     |
| propertyType    | text      | Property type (e.g., Apartment, House)              |
| user_id         | uuid      | Owner/creator (FK to profiles)                      |
| videoUrl        | text      | Video URL (from propertyvideos bucket)              |
| amenities       | text[]    | Array of amenities                                  |
| lifestyletags   | text[]    | Array of lifestyle tags                             |
| map_location    | text      | Map location (coordinates or address)               |
| lifestyleTags   | text[]    | Array of lifestyle tags                             |
| deleted_at      | timestamp | When the property was deleted (soft delete)         |
| approval_status | text      | Approval state (`pending`, `approved`, etc.)        |
| community_id    | uuid      | Linked community                                    |

## poll_options
| Column        | Type   | Description                                 |
|---------------|--------|---------------------------------------------|
| id            | uuid   | Primary key                                 |
| poll_post_id  | uuid   | The poll (post) this option belongs to (FK) |
| option_text   | text   | The text/label for this poll option         |

## market_items
| Column         | Type      | Description                                         |
|----------------|-----------|-----------------------------------------------------|
| id             | uuid      | Primary key                                         |
| title          | text      | Item title                                          |
| description    | text      | Item description                                   |
| price          | numeric   | Price                                               |
| category       | text      | Category (e.g., Electronics, Furniture)             |
| condition      | text      | Condition (e.g., New, Used)                         |
| location       | text      | Location/city                                       |
| imagefiles     | text[]    | Array of image URLs (from itemimages bucket)        |
| videourl       | text      | Video URL (from itemvideos bucket)                  |
| seller_id      | uuid      | Seller's profile ID (FK to profiles)                |
| created_at     | timestamp | When the item was created                           |
| user_id        | uuid      | User who created the item (FK to profiles)          |
| tags           | text[]    | Array of tags                                       |
| updated_at     | timestamp | Last update time                                    |
| deleted_at     | timestamp | When the item was deleted (soft delete)             |
| approval_status| text      | Approval state (`pending`, `approved`, etc.)        |
| community_id   | uuid      | Linked community                                    |
