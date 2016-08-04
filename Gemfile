source "https://rubygems.org"

gem 'rake'
gem 'activesupport'

gem 'sinatra'
gem 'sinatra-contrib'
gem 'sinatra-activerecord'

gem 'puma'
gem 'tux'

group :development, :test do
  gem 'pry'
  gem 'shotgun'
  gem 'sqlite3'
end

# bundle install --without test --without development
group :production do
  gem 'pg'
end
