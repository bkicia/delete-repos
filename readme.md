## delete-repos

This is a script for deleting unwanted GitHub repos.

Simply clone the repo
`git clone https://github.com/bwegryn/delete-repos`

Run `npm install`

Run `node index <token>`

This will create a repo.list file which you will then go through and delete any repository names you would like to keep.

To delete the repos in repo.list run `node index -D <token>`

